---
section: core-concepts
title: CSS and Styling
order: 7
active: true
---

# CSS and Styling

Some frameworks modify the behavior of the [`<style>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style) tags, however as a standards based framework, instead of modifying behavior, we strive to build on top of it.

## Styling components

[Vite provides](https://vitejs.dev/guide/features.html#css) a simple way to manage CSS for a complex web app by allowing users to import CSS using ESM syntax anywhere in the component tree. One possible architecture is to write CSS in a file accompanying your component file.

```
src/
├── components/
│   ├── Button.tsx
│   ├── Button.css
```

Let's suppose we want to color the buttons in our component blue. We can style the button in the normal way:

```css
button {
  background-color: #446b9e;
}
```

And then import our CSS file in the component:

```tsx
import "./Button.css";

function Button(props) {
  return <button>{props.text}</button>;
}
```

You may notice that the CSS you just imported is _global_. This means that all buttons (not just the ones created via this component) will be blue! In many cases, global CSS is not the intended behavior. One simple solution is to make use of CSS features like [class selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Class_selectors).

Typically, this would involve adding a class to the root element, and then updating each CSS rule to use a child selector. This works excellent for a small component, but for a complex one, adding a child selector to each CSS rule for the component can get tedious.

```css
div.card {
  background-color: #446b9e;
}
div.card > h1 {
}
div.card > p {
}
```

### CSS Modules for scoped styles

SolidStart also supports [vite's CSS modules](https://vitejs.dev/guide/features.html#css-modules). Through [CSS modules](https://github.com/css-modules/css-modules), you can scope certain CSS to a component. This means that you can use the same CSS class in two components, and have both of them styled differently.

To use the feature, change the file extension from `.css` to `.module.css` (or from `.scss` or `.sass` to `.module.scss` or `.module.sass`) and update the import accordingly. You will notice that suddenly your CSS stops working!

This is because behind the scenes, classes defined in the CSS module are being renamed to a series of random letters. When we hard code classes using the class attribute (`class="card"`), Solid does not know it should rename card to something different.

To fix this, you can import classes used in your CSS module. You can think of this import as an object of `humanClass: generatedClass`. We reference the key (the class name we wrote!), and get back the unique, generated class name.

```tsx
import styles from "./Card.module.css";

function Card(props) {
  return <div class={styles.card}>{props.text}</div>;
}
```

### Getting sassy

You may want to utilize the power of [SCSS/Sass](https://sass-lang.com) & other pre-processors. SCSS adds many zero cost CSS abstractions. [Vite has first class support for pre-processors](https://vitejs.dev/guide/features.html#css-pre-processors), so to use SCSS files, simply run:

```bash
npm add -D sass
```

Then change the extension from `.css` to `.scss` and update your imports accordingly.

## To-do

- Can use Tailwind, etc.

- SSR CSS and using some CSS-in-js solution that requires you to render the stylesheet separately and add it to the HTML before sending it to client.
  - Try to use https://github.com/solidjs/solid-styled-components as an example.
