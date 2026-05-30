# Fourier Transform

This module implements the `/modules/fourier` learning path inside the existing Form & Flow platform.

It uses the shared platform shell, module registry, `GraphCanvas`, `Formula`, `SelectMenu`, and the safe expression parser from `src/core/math/expression.ts`. The math convention is normalized time `t in [0, 1]` with coefficients:

```text
C(f) = (1/N) sum x[n] exp(-i 2*pi*f*n/N)
```

No backend, `eval`, `Function`, FFT dependency, or video export is used.
