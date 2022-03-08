<title>src/routes/**/*</title>

- [Usage](#usage)
  - [Basic Pages](#basic-pages)
  - [Dynamic route parameters](#dynamic-route-parameters)
  - [Layout routes](#layout-routes)
  - [Catch all routes](#catch-all-routes)

---

## Usage

### Basic Pages

```ts {2,3}
src/
├── routes/
│   ├── about.tsx
│   └── index.tsx
└── root.tsx
```

### Dynamic Route Params

```ts {3}
src/
├── routes/
│   ├── blog/
│   │   ├── [postId].tsx
│   │   ├── categories.tsx
│   │   ├── index.tsx
│   ├── about.tsx
│   └── index.tsx
└── root.tsx
```

### Layout Routes

```ts {2,7}
src/
├── routes/
│   ├── blog/
│   │   ├── [postId].tsx
│   │   ├── categories.tsx
│   │   ├── index.tsx
│   ├── about.tsx
│   ├── blog.tsx
│   └── index.tsx
└── root.tsx
```

### Catch all Routes

```ts {8}
src/
├── routes/
│   ├── blog/
│   │   ├── [postId].tsx
│   │   ├── categories.tsx
│   │   ├── index.tsx
│   ├── about.tsx
│   ├── index.tsx
│   └── [...404].tsx
└── root.tsx
```
