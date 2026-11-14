---
{
  "title": "Contractibility as Uniqueness",
  "summary": "What it means for composition to be unique when the choices form a space.",
  "context": "Seminar notes · 2022",
  "note": "Revised from notes accompanying a Lisbon Mathematics Graduate Student Seminar talk."
}
---

## When composites form a space

In a groupoid, two composable arrows have a unique composite. In an $\infty$-groupoid, we can ask for more data. Given paths $f:x\to y$ and $g:y\to z$, we seek a third path $h:x\to z$ together with a two-dimensional witness that these paths fit together. The choices of $h$ and witness form a space.

Model the $\infty$-groupoid by a Kan complex $X$. The two edges determine a map $\Lambda^2_1\to X$ from the inner horn of a triangle. The space of composites is the fiber over that horn of
$$
X^{\Delta^2}\longrightarrow X^{\Lambda^2_1}.
$$
Here a point in the fiber records the missing edge and the filled triangle together. The horn inclusion is anodyne. Since $X$ is Kan, restriction is a trivial Kan fibration. Its fibers are contractible. That is the sense in which composition is unique.

The same argument can be phrased using [Segal spaces](../complete-segal-spaces/). The degree-two Segal map sends a coherent triangle to its pair of consecutive edges.

## From ordinary uniqueness to contractibility

To say that a set $C$ has a unique element is to assert
$$
\exists x\in C,\quad \forall y\in C,\quad x=y.
$$
In a proof-relevant setting, the expression $x=y$ has its own inhabitants. When $C$ is a space, these inhabitants are paths from $x$ to $y$. The corresponding type of witnesses to uniqueness is
$$
\sum_{x:C}\prod_{y:C}(x=y).
$$
A point of this type consists of a point $x$ and a family of paths from $x$ to every $y$, varying continuously with $y$ in the space interpretation. Such a family is a homotopy from the constant map at $x$ to the identity. The point $x$ is called a **center of contraction**.

This explains why contractibility expresses uniqueness in the preceding example. There can be many choices of filled triangle, and many paths between choices. The space of all that data has the homotopy type of a point.

For the proof-relevant definition, see [*Homotopy Type Theory*, §3.11](https://homotopytypetheory.org/book/).
