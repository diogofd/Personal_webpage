---
{
  "title": "A Primer on Categories, Presheaves, and Simplicial Sets",
  "summary": "From finite ordinals and the Yoneda embedding to standard simplices, with exercises.",
  "context": "Preparatory seminar notes",
  "note": "Adapted from the Lecture 1 preparatory notes for the Seminar on ∞-categories."
}
---

## Categories and posets

A category $\mathcal C$ consists of objects and, for each pair of objects $x,y$, a set $\operatorname{Hom}_{\mathcal C}(x,y)$ of morphisms. Composition is associative and each object $x$ has an identity $\mathrm{id}_x$.

A **partially ordered set**, or poset, is a set $P$ with a reflexive, antisymmetric, and transitive relation $\leq$. A poset is itself a category. Its objects are the elements of $P$, and there is one arrow $x\to y$ if $x\leq y$. Reflexivity supplies the identities and transitivity supplies composition.

The **simplex category** $\Delta$ is the category of finite nonempty ordinals $[n]=\{0<1<\cdots<n\}$ and weakly increasing maps. Two families of maps do much of the work:

- The face map $\delta_i:[n-1]\to[n]$ misses $i$ and is strictly increasing.
- The degeneracy map $\sigma_i:[n]\to[n-1]$ repeats $i$ and is surjective.

For example, the face maps $[0]\to[1]$ select the two endpoints. The degeneracy map $[1]\to[0]$ sends both endpoints to the same point. Every map in $\Delta$ factors uniquely as a surjection onto its image followed by the inclusion of that image. In particular, each surjection is a composite of degeneracy maps.

## Functors and natural transformations

A **functor** $F:\mathcal C\to\mathcal D$ assigns objects and morphisms while preserving identities and composition. Functors between posets are order-preserving maps. Another example comes from a group $G$. Form the one-object category $BG$ with $G$ as its endomorphisms. A functor $BG\to\mathbf{Set}$ is a left $G$-set.

A **natural transformation** $\eta:F\Rightarrow G$ gives a morphism $\eta_c:F(c)\to G(c)$ for every object $c$ so that for each $f:c\to d$,
$$
G(f)\circ\eta_c=\eta_d\circ F(f).
$$
Both sides go from $F(c)$ to $G(d)$. This is the naturality square written as an equation.

## Presheaves, limits, and colimits

A **presheaf** on $\mathcal C$ is a functor $X:\mathcal C^{\mathrm{op}}\to\mathbf{Set}$. Each object $c$ determines a representable presheaf $\operatorname{Hom}_{\mathcal C}(-,c)$. Its restriction map along $f:x\to y$ sends $g:y\to c$ to $g\circ f$.

The **Yoneda lemma** says that evaluating a natural transformation at $\mathrm{id}_c$ gives a bijection
$$
\operatorname{Nat}(\operatorname{Hom}_{\mathcal C}(-,c),X)\cong X(c).
$$
To see the inverse, take $a\in X(c)$. At an object $d$, send each $g:d\to c$ to $X(g)(a)$. Naturality forces precisely this formula. Taking $X$ representable gives the fully faithful Yoneda embedding of $\mathcal C$ into its presheaf category.

Let $F:J\to\mathcal C$ be a diagram. A cone with apex $c$ is a family $\lambda_j:c\to F(j)$ compatible with the arrows in $J$. Its universal object, when it exists, represents the presheaf $\operatorname{Cone}(-,F)$:
$$
\operatorname{Hom}_{\mathcal C}(c,\lim_J F)\cong\operatorname{Cone}(c,F).
$$
Equivalently, a limit cone is a terminal object in the category of cones. The colimit is the dual construction, using cocones and an initial object.

The **category of elements** of a presheaf $X$ has objects $(c,a)$ with $a\in X(c)$. An arrow $(c,a)\to(d,b)$ is an arrow $f:c\to d$ for which $X(f)(b)=a$. This construction lets us regard all the elements of a presheaf, at all objects of $\mathcal C$, in a single category.

## Simplicial sets

A **simplicial set** is a presheaf $X$ on $\Delta$. Write $X_n=X([n])$. Applying $X$ to $\delta_i$ gives a face operator $d_i:X_n\to X_{n-1}$, and applying it to $\sigma_i$ gives a degeneracy operator $s_i:X_{n-1}\to X_n$.

A simplex $x\in X_n$ is **degenerate** if $x=X(\alpha)(y)$ for some surjection $\alpha:[n]\to[m]$ with $m<n$ and $y\in X_m$. Using the factorization of surjections in $\Delta$, prove that this is equivalent to $x$ being in the image of a single $s_i$.

The standard simplex $\Delta^n$ is the presheaf represented by $[n]$, so that
$$
(\Delta^n)_m=\operatorname{Hom}_\Delta([m],[n]).
$$
Yoneda identifies a map $\Delta^n\to X$ with an $n$-simplex of $X$. This gives a precise meaning to the idea of building $X$ by gluing together standard simplices.

## Exercises

1. For a covariant functor $F:\mathcal C\to\mathbf{Set}$, identify its category of elements with the comma category $\{\ast\}\downarrow F$.
2. Find a terminal object of the slice category $\mathcal C_{/c}$ and show that it is terminal.
3. View $\operatorname{Hom}_{\mathcal C}(-,-)$ as a functor $\mathcal C^{\mathrm{op}}\times\mathcal C\to\mathbf{Set}$. Describe the objects and arrows of its category of elements. Why is it called the **twisted arrow category**?
4. Prove that the projection from the category of elements of a presheaf to $\mathcal C$ is a discrete right fibration. Formulate and prove the dual statement for a covariant functor.
5. Show that limits and colimits of presheaves are computed objectwise.
6. Show that $X$ is the colimit of the diagram of representables $\operatorname{Hom}_{\mathcal C}(-,c)$ indexed by its category of elements. At an object $d$, the maps into $X(d)$ send $(c,a,g:d\to c)$ to $X(g)(a)$. Apply this to simplicial sets.
