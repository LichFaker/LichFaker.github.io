---
title: Golang学习——基础语法
date: 2018-01-20 11:30:34
tags: Golang
---

## 变量

### 命名

命名规则同其他语言一样，以一个字母（Unicode字母）或下划线开头，后面可以跟任意数量的字母、数字或下划线。其中大写字母开头的，可以被其他包访问(相当于`public`)；否则只能在包内使用(相当于`private`)。

常量、变量、类型、接口、结构、函数等的名称命名规则均一样。

### 声明

按照Go语言规范，任何类型在未初始化时都对应一个零值：布尔类型是false，整型是0，字符串是""，而指针，函数，interface，slice，channel和map的零值都是nil。

```
var str string // str == ""
var i int      // i == 0
var f float64  // f == 0
var p *int     // p == nil
s := "hello"   // 只能在函数或者方法内
p2 := new(int) // p2, *int 类型, 指向匿名的 int 变量
```
<!-- more -->
go 语言中没有使用的包或者变量，会导致编译失败

```
//"net/http" 包导入不使用，如果包里面有 init 方法，只执行 init 方法
import(
    "fmt"
    _ "net/http"
)
```

### 分组定义

```
// 定义常量
const (
	pi      = 3.1415926
	charset = "UTF-8"
)

// 变量
var (
	index int
	count int
)

// 结构体
type (
	student struct {
		name  string
		age   int
		grade string
	}
	teacher struct {
		name    string
		age     int
		subject string
	}
)
```

### 基础变量类型

#### 整型

不同类型的变量运算前需进行转换。

有符号整数采用2的补码形式表示，也就是最高bit位用来表示符号位，一个n-bit的有符号数的值域是从-2^{n-1}到2^{n-1}-1。

无符号整数的所有bit位都用于表示非负数，值域是0到2^n-1。

- 有符号
    * int 长度取决于操作系统，32位操作系统是32位，64位操作系统是64位
    * rune 它是int32的别名，相当于`char`，`UTF-8`三字节，所以`rune`采用4字节兼容其他编码
    * int8
    * int16
    * int32
    * int64
- 无符号
    * uint
    * byte 等同于uint8
    * uint8
    * uint16
    * uint32
    * uint64
    * uintptr 没有指定具体的bit大小但是足以容纳指针。 具体大小根据操作系统改变。

#### 浮点型
* float32 最大值math.MaxFloat32，可以提供大约6个十进制数的精度
* float64 最大值math.MaxFloat64，可以提供大约15个十进制数的精度

#### 复数
Go语言提供了两种精度的复数类型：`complex64`和`complex128`，分别对应`float32`和`float64`两种浮点数精度。（实部和虚部分别是32位，64位）内置的complex函数用于构建复数，内建的real和imag函数分别返回复数的实部和虚部.

```
var x complex128 = complex(1, 2) // 1+2i
var y complex128 = complex(3, 4) // 3+4i
fmt.Println(x*y)                 // "(-5+10i)"
fmt.Println(real(x*y))           // "-5"
fmt.Println(imag(x*y))           // "10"
```
#### Boolean
关键词 `bool` 用于定义 boolean类型变量，boolean 类型变量的取值只有 true 和 false, 零值(默认值)为 false
golang 不允许把 boolean 类型转变为数字类型

#### 常量
常量表达式的值在编译期计算，而不是在运行期。通过`const`声明。

在一个`const`声明语句中，在第一个声明的常量所在的行，iota将会被置为0，然后在每一个有常量声明的行加一。（类似java中的枚举）

```
type Weekday int

const (
    Sunday Weekday = iota
    Monday
    Tuesday
    Wednesday
    Thursday
    Friday
    Saturday
)

const (
	b = 1 << (10 * iota)
	kb
	mb
	gb
	tb
	pb
)
```

#### 字符串

字符串是不可改变的采用UTF8编码的Unicode码点（rune）序列

```
s := "hello, world"
fmt.Println(len(s))     // "12"
fmt.Println(s[0], s[2]) // "104 108" ('h' and 'l')
c := s[len(s)]          // panic: runtime error: index out of range
s[0] = 'L'              // compile error: cannot assign to s[0]
```

* `bytes`包也提供了很多类似功能的函数，但是针对和字符串有着相同结构的`[]byte`类型。因为字符串是只读的，因此逐步构建字符串会导致很多分配和复制。在这种情况下，使用`bytes.Buffer`类型将会更有效
* `strconv`包提供了布尔型、整型数、浮点数和对应字符串的相互转换，还提供了双引号转义相关的转换
* `unicode`包提供了IsDigit、IsLetter、IsUpper和IsLower等类似功能，它们用于给字符分类。
* `strings`包提供了许多如字符串的查询、替换、比较、截断、拆分和合并等功能

### 生命周期

* 在包级别声明的变量会在main入口函数执行前完成初始化，局部变量将在声明语句被执行到的时候完成初始化。
* 包变量一直常驻在内存到程序的结束，然后被系统垃圾回收器回收。也就是说包变量的生命周期是整个程序的执行时间。
* 局部变量，没有外部指针指向它，函数退出我们没有路径能访问到这个变量，这时它占用的存储空间就会被回收。

## 控制结构
### 条件语句
#### if else

* 不需要括号
* if条件里可以赋值
* 赋值的变量作用域就在这个if语句里

```
func conditions(filename string) {
	if file, err := os.Open(filename); err != nil {
		panic(err)
	} else {
		fmt.Println(file)
	}
}
```

#### switch

* `switch`会自动`break`，除非使用`fallthrough`
* `switch`的case不仅限于整数，可以是字符串、条件表达式等

```
func grade(score int) string {
	g := ""
	switch {
	case score < 0 || score > 100:
		panic(fmt.Sprintf("Wrong score: %d", score))
	case score < 60:
		g = "F"
	case score < 70:
		g = "D"
	case score < 80:
		g = "C"
	case score < 90:
		g = "B"
	case score <= 100:
		g = "A"
	}
	return g
}
```

### 循环

* 没有`while`，只能用`for`实现循环
* `for`条件里不需要括号
* 可以省略初始条件，结束条件，递增表达式

```
func binarySearch(num []int, target int) int {
	if len(num) == 0 || num == nil {
		return -1
	}

	start, end := 0, len(num)-1
	var mid int

	for start+1 < end {
		mid = start + (end-start)/2
		switch {
		case num[mid] == target:
			// first end = mid; last start = mid; if any position, just return
			end = mid
		case num[mid] < target:
			start = mid
		case num[mid] > target:
			end = mid
		}
	}

	if num[start] == target {
		return start
	} else if num[end] == target {
		return end
	}

	return -1
}
```

## 内建容器
### 数组

* 数组是值类型，在函数中做参数时， 会拷贝整个数组
* [10]int 和 [20]int是不同的类型
* 声明定义时必须指定大小，或者通过[...]int {}系统自动识别大小
* go中一般不直接使用数组


### Slice

#### Slice 概念

* Slice 本身没有数据， 是对底层Array 的一个view
* Slice 之上可以继续Slice， 这些slice都是对同一个Array的view
* Slice 不可以向前扩展，但可以向后扩展；s[i]不可以超越len(s), 向后扩展不可以超过底层数组cap(s)

```
arr := []int{0, 1, 2, 3, 4, 5, 6, 7}

fmt.Println("arr[2:6] = ", arr[2:6]) // [2 3 4 5]
fmt.Println("arr[:6] = ", arr[:6])   // [0 1 2 3 4 5]
fmt.Println("arr[2:] = ", arr[2:])   // [2 3 4 5 6 7]

// Extending slice
s1 := arr[2:6]
s2 := s1[3:5]
// s1 = [2 3 4 5], len(s1) = 4, cap(s1) = 6
fmt.Printf("s1 = %v, len(s1) = %d, cap(s1) = %d\n",
	s1, len(s1), cap(s1))
// s2 = [5 6], len(s2) = 2, cap(s2) = 3
fmt.Printf("s2 = %v, len(s2) = %d, cap(s2) = %d\n",
	s2, len(s2), cap(s2))

fmt.Println(s1[5])   // index out of range
fmt.Println(s1[3:7]) // slice bounds out of range
```

#### Slice 操作

* 添加元素如果超过cap, 系统会新分配一个更大的底层数组
* 由于值传递的关系， 必须接收 `append`的返回值, 即 `s = append(s, val)`

```
var s []int // s == nil

// cap 空间不够时，每次增加一倍
for i := 0; i < 100; i++ {
	printSlice(s)
	s = append(s, i)
}

s1 := []int{2, 4, 6, 8}
printSlice(s1)

// 指定slice初始大小
s2 := make([]int, 16)
s3 := make([]int, 10, 32)

printSlice(s2)
printSlice(s3)

// Copying slice
copy(s2, s1)
printSlice(s2)

// Deleting elements from slice
s2 = append(s2[:3], s2[4:]...)
printSlice(s2)
```

### Map

* 在Go语言中，一个map就是一个哈希表的引用，所以map的key是无序的
* map类型可以写为map[K]V，其中K对应的key必须是支持==比较运算符的数据类型

```
func maxLenOfNoRepeatingStr(s string) int {
	lastOccurred := make(map[rune]int)

	start := 0
	maxLen := 0

	for i, ch := range []rune(s) {
		lastI, ok := lastOccurred[ch]
		if ok && lastI > start {
			start = lastI + 1
		}

		if i-start+1 > maxLen {
			maxLen = i - start + 1
		}

		lastOccurred[ch] = i
	}

	return maxLen
}
```

