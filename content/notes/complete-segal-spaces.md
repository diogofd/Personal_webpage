---
{
  "title": "Complete Segal Spaces",
  "summary": "The Reedy and Segal conditions, with a worked argument for uniqueness of composition.",
  "context": "Companion to the February 2022 slides",
  "note": "A web companion to the lecture deck, focused on the argument for contractibility of the space of composites."
}
---

## Composable arrows and coherent triangles

Let $X$ be a Reedy fibrant simplicial space. The space of arrows from $x$ to $y$ is the fiber $\operatorname{map}_X(x,y)$ of the endpoint map from $X_1$ to $X_0\times X_0$. A coherent triangle in $X_2$ records a composable pair, a third edge, and the coherence between them.

Restriction to the spine of the $2$-simplex gives the map
$$
(d_2,d_0):X_2\longrightarrow X_1\times_{X_0}X_1.
$$
The right-hand side records two arrows with matching endpoints. Reedy fibrancy makes this restriction a fibration. To see this, restrict first to the boundary of the triangle, and then forget the third edge. The first map is the matching fibration. The second is a pullback of the endpoint fibration for $X_1$.

The **Segal condition** says, more generally, that restriction to the spine gives an equivalence
$$
X_n\simeq
\underbrace{X_1\times_{X_0}\cdots\times_{X_0}X_1}_{n\text{ factors}}
$$
for every $n\geq 2$. Thus the degree-two map is a trivial fibration. For a pair $(f,g)$ of composable arrows, its fiber is the space of choices of a coherent composite. This fiber is contractible. Restricting a triangle in the fiber along $d_1$ gives an arrow from the source of $f$ to the target of $g$.

The higher Segal maps express the same principle for longer strings. They keep track of the coherence of compositions with three or more factors.

## Completeness

Let $X_{\mathrm{eq}}\subseteq X_1$ be the union of components consisting of arrows that are equivalences in the homotopy category of $X$. The **completeness condition** asks that the identity degeneracy
$$
s_0:X_0\longrightarrow X_{\mathrm{eq}}
$$
be an equivalence. This makes paths in the object space reflect equivalences between objects. The argument for composition above already takes place at the level of Segal spaces.

See [Contractibility as Uniqueness](../contractibility-as-uniqueness/) for the analogous argument using Kan complexes and its connection with a center of contraction.
