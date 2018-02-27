---
title: Golang并发编程
date: 2018-02-27 13:57:03
tags: 
 - Golang
 - 并发
---

## Goroutine

在Go语言中，语言本身就已经实现和支持了并发， 我们只需要通过`go`关键字来开启`goroutine`即可。

gouroutine其实就是一种协程，类似其他语言中的coroutine， 是在编译器或虚拟机层面上的多任务。它可以运行在一个或多个线程上，但不同于线程，它是**非抢占式的**，所以协程很轻量。

```
func main() {
    for i := 0; i < 1000; i++ {
    go func(ii int) {
        for {
            fmt.Printf("Hello %d\n", ii)
        }
        }(i)
    }

    time.Sleep(time.Millisecond)
}
```

上述代码就开启了1000个协程，在1ms内不断的打印字符串，这里需要注意两个点：

1. time.Sleep
    在main函数退出前，Sleep了1ms。这是因为当main函数退出时，之前开的协程也会随着退出，如果不Sleep，则无法看到打印信息。

2. 匿名函数将变量i作为参数赋值传入。
    如果不传参，变量i也能被使用，但是是以引用的方式。而i在main函数中在不断自增，导致在goroutine打印信息中，无法知道是第几个协程打印的。

从打印信息上看，跟开线程没什么区别，无非就是数量上不同。但是在操作系统层面，线程是抢占式，而我们之前说协程是非抢占式的，这怎么会一样呢？

<!-- more -->

出现上述问题的原因在于，在调用`Printf`的时候，进行了切换， goroutine主动让出了控制权。我们修改代码如下，演示下非抢占：

```
a := [10]int{}
for i := 0; i < 10; i++ {
    go func(ii int) {
        for {
            a[ii]++
        }
    }(i)
}

time.Sleep(time.Millisecond)
fmt.Println(a)
```

运行上述代码，出现了死循环。因为在开辟的第一个goroutine中，一直循环执行`a[ii]++`，一直没有让出控制权；而`main`本质上也是个goroutine，所以后面的代码都没有执行完，也没有退出。

遇到这种情况，我们可以在goroutine中主动让出控制权，例如：

```
a[ii]++
runtime.Gosched()
```

goroutine 可能会切换的点 （不能保证）:

* I/O,select
* channel
* 等待锁
* runtime.Gosched()

## CSP并发模型

Go实现了两种并发形式：

1. 共享内存 + 锁同步
2. CSP. 通过goroutine和channel来实现的.

CSP并发模型是在1970年左右提出的概念，属于比较新的概念，不同于传统的多线程通过共享内存来通信，CSP讲究的是“以通信的方式来共享内存”。

>Do not communicate by sharing memory; instead, share memory by communicating
>不要以共享内存的方式来通信，相反，要通过通信来共享内存。

## channel

channel 是用来在不同goroutine之间进行通信的，无论传值还是取值， 它都是阻塞的。

```
c := make(chan int)
c <- 1
```

上面代码直接运行会造成死锁：

```
all goroutines are asleep - deadlock!
```

所以一般在使用channel前先开一个goroutine去接收channel:

```
func createWorker() chan int {
    c := make(chan int)
    go func() {
        for n := range c {
            fmt.Println("received:", n)
        }
    }()

    return c
}

func main() {
    var channels [10]chan int

    for i, _ := range channels {
        channels[i] = createWorker()
    }

    for i, c := range channels {
        c <- i
    }

    time.Sleep(time.Millisecond)
}
```

在上述代码中，我们定义了一个`createWorker`，用来创建一个接收者，同时返回了一个channel。同时我们可以对返回的channel做限制，例如：

```
func createWorker() chan<- int // 只能发送数据
func createWorker() <-chan int // 只能接收数据
```

一般可以通过`n := <- c`来接收数据，在上述例子中使用了range，因为channel是可以close的。

`close(c)`关闭channel， 但是关闭后在worker中依然能接收到channel（只要goroutine没有退出）。而接收到的数据是定义的channel的零值，在上述例子中，则收到0.

* 通过`n,ok := <- c`的ok来判断channel是否关闭；也可以通过range来接收；

* 如果往已经关闭的channel写数据，会panic：`send on closed channel`. **不要从接收端关闭channel，也不要关闭有多个并发发送者的channel**

### 等待任务结束

在之前的例子中，我们都是通过Sleep方法来粗略的控制任务的执行，这在实际生产中肯定不能这么干。之前也说了channel是用来通信的，那么我们可以通过channel来告诉使用者任务已经执行完了。 代码优化如下：

```
type worker struct {
    in   chan int
    done chan bool
}

func createWorker() worker {
    w := worker{
        in:   make(chan int),
        done: make(chan bool),
    }

    go func(w worker) {
        for n := range w.in {
            fmt.Println("received:", n)
            w.done <- true
        }
    }(w)

    return w
}

func chanNormal() {
    var workers [10]worker

    for i, _ := range workers {
        workers[i] = createWorker()
    }

    for i, w := range workers {
        w.in <- i
    }

    for _, w := range workers {
        <-w.done
    }

}

func main() {
    chanNormal()
}
```

除了我们自己定义channel，go也为我们提供了`sync.WaitGroup`，来管理一组任务。

```
var wg sync.WaitGroup
wg.Add(1)
wg.Done()
wg.Wait()
```

### Tip

将struct中的done抽象成一个方法，在`create`的时候实现，这样在`worker`中就不用管具体代码了，只要调用done方法即可。
