---
title: LeetCode 289. 生命游戏
description: 用原地状态编码实现生命游戏，讲清矩阵模拟、邻居统计、两轮遍历与空间复杂度。
---

# LeetCode 289. 生命游戏

> 题目地址：[289. 生命游戏](https://leetcode.cn/problems/game-of-life/description/)

## 适合人群

- 做矩阵题时，容易把“读旧状态”和“写新状态”混在一起的开发者
- 知道模拟题能做，但不知道怎么满足“原地更新”要求的人
- 想把“状态压缩 / 原地标记”这种套路真正掌握的人

## 学习目标

- 理解这题的本质是矩阵模拟，而不是图搜索或 DP
- 明确为什么不能一边更新一边直接覆盖原值
- 掌握“用中间状态保留旧信息”的原地编码技巧

## 快速导航

- [题目理解](#题目理解)
- [先说结论](#先说结论)
- [为什么不能边算边直接改](#为什么不能边算边直接改)
- [原地编码怎么设计](#原地编码怎么设计)
- [多语言实现](#多语言实现)
- [复杂度分析](#复杂度分析)
- [高频问题](#高频问题)
- [延伸练习](#延伸练习)

## 题目理解

给定一个 `m x n` 的二维网格 `board`：

- `1` 表示活细胞
- `0` 表示死细胞

每个细胞都会根据周围 8 个方向的邻居数量，在下一轮变成新的状态。

规则可以收成四句：

- 活细胞周围活邻居少于 2 个，会死
- 活细胞周围活邻居是 2 或 3 个，会继续存活
- 活细胞周围活邻居多于 3 个，会死
- 死细胞周围活邻居恰好是 3 个，会复活

题目的难点不在规则本身，而在这句隐含要求：

```text
所有细胞应该基于“同一轮的旧状态”同时更新
```

## 先说结论

最稳妥的做法是两轮遍历：

1. 第一轮统计每个位置周围的活邻居数，并把“新状态”编码回原数组
2. 第二轮把中间状态还原成最终的 `0 / 1`

核心点在于：

- 第一轮里不能直接把 `1` 改成 `0` 或把 `0` 改成 `1`
- 否则后面统计邻居时，读到的就不是旧状态了

## 为什么不能边算边直接改

假设你已经把左上角某个活细胞直接改成了 `0`，那它右边那个格子在统计邻居时，就会误以为这个细胞原本是死的。

但题目要求的是：

- 所有格子的下一状态，都必须基于这一轮开始时的旧棋盘来计算

所以我们必须同时满足两件事：

- 之后的格子还能读到“旧状态”
- 当前格子又要能记录“新状态”

这就是这题需要中间状态编码的原因。

## 原地编码怎么设计

一种常见编码方式如下：

| 旧状态 | 新状态 | 编码值 |
| --- | --- | --- |
| `0` | `0` | `0` |
| `1` | `1` | `1` |
| `1` | `0` | `2` |
| `0` | `1` | `-1` |

这样设计的好处是：

- `1` 和 `2` 都表示“旧状态是活的”
- `0` 和 `-1` 都表示“旧状态是死的”

于是第一轮统计邻居时，只要把下面两种情况都算作旧活细胞即可：

- 当前值是 `1`
- 当前值是 `2`

等第一轮全部标完，再做第二轮转换：

- `2 -> 0`
- `-1 -> 1`

## 多语言实现

四种语言共用同一套「两轮遍历 + 中间状态编码」骨架：第一轮把结果编码为 `2 / -1`，第二轮统一归并回 `0 / 1`。点击 tab 切换语言。

::: code-group

```go [Go]
func gameOfLife(board [][]int) {
	if len(board) == 0 || len(board[0]) == 0 {
		return
	}

	directions := [8][2]int{
		{-1, -1}, {-1, 0}, {-1, 1},
		{0, -1},           {0, 1},
		{1, -1},  {1, 0},  {1, 1},
	}

	m, n := len(board), len(board[0])

	countLiveNeighbors := func(r, c int) int {
		live := 0
		for _, d := range directions {
			nr, nc := r+d[0], c+d[1]
			if nr < 0 || nr >= m || nc < 0 || nc >= n {
				continue
			}
			if board[nr][nc] == 1 || board[nr][nc] == 2 {
				live++
			}
		}
		return live
	}

	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			live := countLiveNeighbors(r, c)

			if board[r][c] == 1 && (live < 2 || live > 3) {
				board[r][c] = 2
			}
			if board[r][c] == 0 && live == 3 {
				board[r][c] = -1
			}
		}
	}

	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if board[r][c] == 2 {
				board[r][c] = 0
			} else if board[r][c] == -1 {
				board[r][c] = 1
			}
		}
	}
}
```

```ts [TypeScript]
function gameOfLife(board: number[][]): void {
  if (board.length === 0 || board[0].length === 0) return

  const directions: [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ]

  const m = board.length
  const n = board[0].length

  const countLiveNeighbors = (r: number, c: number): number => {
    let live = 0
    for (const [dr, dc] of directions) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue
      if (board[nr][nc] === 1 || board[nr][nc] === 2) live++
    }
    return live
  }

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const live = countLiveNeighbors(r, c)
      if (board[r][c] === 1 && (live < 2 || live > 3)) board[r][c] = 2
      if (board[r][c] === 0 && live === 3) board[r][c] = -1
    }
  }

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === 2) board[r][c] = 0
      else if (board[r][c] === -1) board[r][c] = 1
    }
  }
}
```

```rust [Rust]
impl Solution {
    pub fn game_of_life(board: &mut Vec<Vec<i32>>) {
        if board.is_empty() || board[0].is_empty() {
            return;
        }

        let directions: [(i32, i32); 8] = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1),
        ];

        let m = board.len() as i32;
        let n = board[0].len() as i32;

        let count_live = |board: &Vec<Vec<i32>>, r: i32, c: i32| -> i32 {
            let mut live = 0;
            for (dr, dc) in directions.iter() {
                let nr = r + dr;
                let nc = c + dc;
                if nr < 0 || nr >= m || nc < 0 || nc >= n {
                    continue;
                }
                let v = board[nr as usize][nc as usize];
                if v == 1 || v == 2 {
                    live += 1;
                }
            }
            live
        };

        for r in 0..m {
            for c in 0..n {
                let live = count_live(board, r, c);
                let cell = board[r as usize][c as usize];
                if cell == 1 && (live < 2 || live > 3) {
                    board[r as usize][c as usize] = 2;
                }
                if cell == 0 && live == 3 {
                    board[r as usize][c as usize] = -1;
                }
            }
        }

        for row in board.iter_mut() {
            for cell in row.iter_mut() {
                if *cell == 2 {
                    *cell = 0;
                } else if *cell == -1 {
                    *cell = 1;
                }
            }
        }
    }
}
```

```python [Python]
class Solution:
    def gameOfLife(self, board: list[list[int]]) -> None:
        if not board or not board[0]:
            return

        directions = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1),
        ]

        m, n = len(board), len(board[0])

        def count_live(r: int, c: int) -> int:
            live = 0
            for dr, dc in directions:
                nr, nc = r + dr, c + dc
                if nr < 0 or nr >= m or nc < 0 or nc >= n:
                    continue
                if board[nr][nc] == 1 or board[nr][nc] == 2:
                    live += 1
            return live

        for r in range(m):
            for c in range(n):
                live = count_live(r, c)
                if board[r][c] == 1 and (live < 2 or live > 3):
                    board[r][c] = 2
                if board[r][c] == 0 and live == 3:
                    board[r][c] = -1

        for r in range(m):
            for c in range(n):
                if board[r][c] == 2:
                    board[r][c] = 0
                elif board[r][c] == -1:
                    board[r][c] = 1
```

:::

**多语言实现要点**

- **共用骨架**：第一轮只编码（`1→2`、`0→-1`），统计邻居时把 `1` 和 `2` 都算作"旧活"；第二轮把 `2→0`、`-1→1` 统一落盘
- **Go**：闭包 `countLiveNeighbors` 直接捕获 `board / m / n`，写法最短
- **TypeScript**：`directions: [number, number][]` 让解构 `for (const [dr, dc] ...)` 更干净；用 `===` 避免 `-1 == '-1'` 隐式转换
- **Rust**：循环下标用 `i32`（便于 `r + dr` 越界判断），读写时再 `as usize`；闭包显式传 `&Vec<Vec<i32>>` 绕开借用冲突；第二轮用 `iter_mut()`
- **Python**：签名写 `-> None` 表明原地修改；**不要**写 `board = [[...]]` 重绑定——会切断原地引用；不用 `numpy`，保持 LeetCode 通用环境

## 复杂度分析

设矩阵大小是 `m x n`。

- 时间复杂度：`O(m * n)`，每个格子都会被访问两次，每次统计 8 个方向，常数固定
- 空间复杂度：`O(1)`，没有额外开一个同规模矩阵

如果不要求原地更新，直接复制一份旧棋盘会更直观，但空间复杂度会变成 `O(m * n)`。

## 高频问题

### Q1：为什么统计邻居时，`2` 要算活，`-1` 不算活？

因为 `2` 表示“旧状态活，新状态死”，而题目要求统计的是旧状态邻居；`-1` 则表示“旧状态死，新状态活”。

### Q2：为什么不用 DFS / BFS？

因为这题不是在找连通块，也不是路径搜索，而是对每个格子独立按规则做同步更新，属于矩阵模拟。

### Q3：如果不用原地更新，会更简单吗？

会。最直观的做法就是复制一份旧矩阵，然后根据旧矩阵计算新矩阵。但题目追问了原地实现，所以更值得掌握状态编码技巧。

### Q4：这题最容易写错的点是什么？

最常见的错误是：

- 第一轮直接把 `1` 改成 `0`
- 统计邻居时把 `-1` 也算成旧活细胞
- 漏掉边界判断

## 延伸练习

如果这题已经写顺，可以继续做这些相邻题型：

- 矩阵置零：练原地标记
- 图像旋转：练矩阵原地变换
- 单词搜索：练二维网格 DFS + 回溯
