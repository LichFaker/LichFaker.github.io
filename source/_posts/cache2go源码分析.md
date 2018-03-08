---
title: cache2go源码分析
date: 2018-03-08 11:58:50
tags: Golang
---
## cache2go 简介

[cache2go](https://github.com/muesli/cache2go)是一个用Go实现的并发安全的缓存库，实现了如下特性:

* 并发安全
* 可设置缓存项的生命周期
* 包含缓存增加、删除的回调函数
* 内置缓存访问计数
* ...

这个库代码量很少，核心代码就三个文件，里面设计的技术点主要包括读写锁、函数式编程、map操作等.

## 源码解析

### 1. 新建

```
cache := cache2go.Cache("myCache")
```

Example中是通过调用cache2go的`Cache`方法，参数是缓存`table`的唯一标识，返回了一个`CacheTable`的指针。
<!-- more -->
```
func Cache(table string) *CacheTable {
	mutex.RLock()
	t, ok := cache[table]
	mutex.RUnlock()

	if !ok {
		mutex.Lock()
		t, ok = cache[table]
		// Double check whether the table exists or not.
		if !ok {
			t = &CacheTable{
				name:  table,
				items: make(map[interface{}]*CacheItem),
			}
			cache[table] = t
		}
		mutex.Unlock()
	}

	return t
}
```

跟踪查看`Cache`方法：

1. 通过**读锁**来查看指定`table`是否存在，存在则返回，否则则创建
2. 创建前增加一个**互斥锁**再次检查`table`是否存在，用来确保线程安全
3. 创建的`table`都是存在一个全局的`map`变量中，其值类型是`CacheTable`

### 2. CacheItem

```
// CacheItem is an individual cache item
// Parameter data contains the user-set value in the cache.
type CacheItem struct {
    // 读写锁
	sync.RWMutex

	// 缓存项的key
	key interface{}
	// 缓存项的值.
	data interface{}
	// 缓存项的生命周期
	lifeSpan time.Duration

	// 创建时间戳
	createdOn time.Time
	// 最近被访问的时间戳
	accessedOn time.Time
	// 被访问的次数
	accessCount int64

	// 被删除时的回调函数(删之前执行)
	aboutToExpire func(key interface{})
}
```

`CacheItem`定义了一些`Set`和`Get`方法，主要是对于结构体中定义的一些属性，其中`KeepAlive`方法会更新每次缓存访问的时间和命中次数.

### 3. CacheTable

#### 结构

```
// CacheTable is a table within the cache
type CacheTable struct {
    // 读写锁
	sync.RWMutex

	// 缓存表标识
	name string
	// 缓存项
	items map[interface{}]*CacheItem

	// 触发缓存清理的定时器
	cleanupTimer *time.Timer
	// 下次缓存清理的时间
	cleanupInterval time.Duration

	// 该缓存表的日志
	logger *log.Logger

	// 获取一个不存在的缓存项时的回调函数
	loadData func(key interface{}, args ...interface{}) *CacheItem
	// 向缓存表新增缓存项时的回调函数
	addedItem func(item *CacheItem)
	// 向缓存表删除缓存项时的回调函数
	aboutToDeleteItem func(item *CacheItem)
}
```

#### 检查缓存过期

检查缓存失效方法`expirationCheck`主要是通过定时器或新增时主动调用来触发的，它主要做了以下几件事：

1. 对整个缓存表加锁, `table.Lock()`
2. 停止当前的缓存清理定时器`cleanupTimer`
3. 遍历当前缓存表中所有缓存项，删除已经失效的缓存项，同时找出最快即将失效的缓存时间
4. 对缓存项的`lifeSpan==0`的当作永久缓存处理
5. 遍历结束后，若还需要继续清理缓存，则更新下次清理缓存的时间，同时重新设置清理触发定时

源码如下：

```
// Expiration check loop, triggered by a self-adjusting timer.
func (table *CacheTable) expirationCheck() {
	table.Lock()
	if table.cleanupTimer != nil {
		table.cleanupTimer.Stop()
	}
	if table.cleanupInterval > 0 {
		table.log("Expiration check triggered after", table.cleanupInterval, "for table", table.name)
	} else {
		table.log("Expiration check installed for table", table.name)
	}

	// To be more accurate with timers, we would need to update 'now' on every
	// loop iteration. Not sure it's really efficient though.
	now := time.Now()
	smallestDuration := 0 * time.Second
	for key, item := range table.items {
		// Cache values so we don't keep blocking the mutex.
		item.RLock()
		lifeSpan := item.lifeSpan
		accessedOn := item.accessedOn
		item.RUnlock()

		if lifeSpan == 0 {
			continue
		}
		if now.Sub(accessedOn) >= lifeSpan {
			// Item has excessed its lifespan.
			table.deleteInternal(key)
		} else {
			// Find the item chronologically closest to its end-of-lifespan.
			if smallestDuration == 0 || lifeSpan-now.Sub(accessedOn) < smallestDuration {
				smallestDuration = lifeSpan - now.Sub(accessedOn)
			}
		}
	}

	// Setup the interval for the next cleanup run.
	table.cleanupInterval = smallestDuration
	if smallestDuration > 0 {
		table.cleanupTimer = time.AfterFunc(smallestDuration, func() {
			go table.expirationCheck()
		})
	}
	table.Unlock()
}
```

#### 新增缓存项

添加缓存项的方法主要在`addInternal`中：

1. 将缓存项存入`table`的`items`map中
2. 调用新增缓存项时的回调函数`addedItem`
3. 若当前缓存生命周期不为0且小于最近失效的时间，则调用`expirationCheck`方法更新并清理

源码如下：

```
func (table *CacheTable) addInternal(item *CacheItem) {
	// Careful: do not run this method unless the table-mutex is locked!
	// It will unlock it for the caller before running the callbacks and checks
	table.log("Adding item with key", item.key, "and lifespan of", item.lifeSpan, "to table", table.name)
	table.items[item.key] = item

	// Cache values so we don't keep blocking the mutex.
	expDur := table.cleanupInterval
	addedItem := table.addedItem
	table.Unlock()

	// Trigger callback after adding an item to cache.
	if addedItem != nil {
		addedItem(item)
	}

	// If we haven't set up any expiration check timer or found a more imminent item.
	if item.lifeSpan > 0 && (expDur == 0 || item.lifeSpan < expDur) {
		table.expirationCheck()
	}
}
```

## 小结

删除和查找跟添加类似，没有分析。总的来说`cache2go`不适合需要大量插入的项目，在每次插入时还要全部遍历检查生命周期，效率有点低下。
