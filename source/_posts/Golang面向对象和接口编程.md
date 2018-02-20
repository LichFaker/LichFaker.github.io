---
title: Golang面向对象和接口编程
date: 2018-02-16 20:15:35
tags: Golang
---

## 面向对象

### 概念

早期编程是面向过程的，比如C语言。面向过程编程在构造系统时，无法解决重用，维护，扩展的问题，而且逻辑过于复杂，代码晦涩难懂，因此产生了面向对象编程思想：把构成问题的各个事物分解成各个对象，对象作为程序的基本单位，将程序和数据封装其中，以提高程序的重用性，灵活性和可扩展性。（封装、继承、多态）

### 封装

1. GO语言没有class，只有struct
2. GO语言仅支持封装。

```
type Node struct {
	Value int
	Left  *Node
	Right *Node
}

func (node *Node) SetValue(value int) {
	node.Value = value
}

func (node *Node) Traverse() {
	if node == nil {
		return
	}

	node.Left.Traverse()
	node.Print()
	node.Right.Traverse()
}

func (node *Node) Print() {
	fmt.Print(node.Value, " ")
}
```

<!-- more -->

说明几个地方：

1. 结构体内只定义属性，方法则是定义在结构体外的
2. GO没有构造函数， 一般通过工厂函数来创建返回对象
3. 上述*Node为receiver，接收者， 它既可以传值也可以传指针；一般情况下，它的类型应该统一，当需要改变结构体内容的时候或者结构体很大时，需要传递指针。
4. 如果接收者为指针，也可以通过值对象访问，GO会自动取其地址， 反之则不行.
5. nil指针也可以调用方法，某些情况下需要特殊处理。
6. 首字母大写： public；首字母小写：private （针对包范围）

#### 对象初始化

```
var root tree.Node
root.SetValue(8)

root.Left = &tree.Node{}
root.Right = &tree.Node{5, nil, nil}
root.Right.Left = new(tree.Node)
root.Left.Right = new(tree.Node)
root.Left.Right.SetValue(6)
root.Right.Left.SetValue(4)

root.Traverse() // 0,6,8,4,5
```

#### 扩展已有类型

由于在Golang中，为结构体创建的方法必须在一个保内，且对象不支持继承。但它提供了两种方法来扩充系统类型或者别人的类型：定义别名；使用组合。

##### 定义别名

在Slice的基础上实现队列。

```
package queue

type Queue []interface{}

func (q *Queue) Push(obj interface{}) {
	*q = append(*q, obj)
}

func (q *Queue) Pop() interface{} {
	if q.IsEmpty() {
		return nil
	}
	head := (*q)[0]
	*q = (*q)[1:]
	return head
}

func (q *Queue) IsEmpty() bool {
	return len(*q) <= 0
}

func main() {
	queue := Queue{}

	queue.Push("Hello")
	queue.Push(1)
	queue.Push(1.5)
	queue.Push(true)

	fmt.Println(queue.Pop())
	fmt.Println(queue.Pop())
	fmt.Println(queue.IsEmpty())
	fmt.Println(queue.Pop())
	fmt.Println(queue.Pop())
	fmt.Println(queue.IsEmpty())
}
```

##### 使用组合

```
// 组合方式扩展
type myNode struct {
	node *tree.Node
}

// 扩展：前序遍历
func (node *myNode) preOrder() {
	if node == nil || node.node == nil {
		return
	}

	node.node.Print()

	left := myNode{node.node.Left}
	right := myNode{node.node.Right}

	left.preOrder()
	right.preOrder()

}
```

### ~~继承~~（Composition）

之前也说过，Golang中不支持继承，但是提供了Composition。

Golang中的Compostion有两种形式, 匿名组合(Pseudo is-a)和非匿名组合(has-a)。

#### 匿名组合

```
type Human struct {
	Name string
	Age  int
}

func (Human) Speak() {
	fmt.Println("Hello!")
}

type Teacher struct {
	Human
	Name    string
	School  string
	Subject string
}

func (t Teacher) Speak() {
	fmt.Printf("My name is %s, I teach %s", t.Name, t.Subject)
}

func main() {
	t := Teacher{Human: Human{
		"Bob",
		18,
	},
		Name:    "John",
		School:  "MIT",
		Subject: "CS",
	}
	// My name is John, I teach CS
	t.Speak()
}
```

#### 非匿名组合

```
type Student struct {
    h      Human //非匿名字段
    school string
}
```

## 面向接口

### 接口的定义和实现

Golang不同于其他语言，接口是由使用者定义，而实现是隐式的， 只需实现接口中定义的方法即可。

### 接口组合

```
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type ReadWriter interface {
    Reader
    Writer
}
```
