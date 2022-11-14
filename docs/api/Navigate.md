---
section: api
title: Navigate
order: 8
subsection: Router
active: true
---

# Navigate

##### `Navigate` is a component that immediately navigates to a new location, like a redirect.

<div class="text-lg">

```tsx twoslash
import { Navigate } from "solid-start";
// ---cut---
<Navigate href="/login" />
```

</div>

<table-of-contents></table-of-contents>

## Usage

```jsx
<Show when={isAuthorized()} fallback={<Navigate href="/login" />}>
  <MyProtectedContent />
</Show>
```

The `Navigate` component  works similarly to `A`, but it will _immediately_ navigate to the provided path as soon as the component is rendered. This is used often to declaratively express redirects. It is a re-export from `@solidjs/router`.

It also uses the `href` prop, but you have the additional option of passing a function to `href` that returns a path to navigate to:

```jsx
function getPath ({navigate, location}) {
  //navigate is the result of calling useNavigate(); location is the result of calling useLocation(). 
  //You can use those to dynamically determine a path to navigate to
  return "/some-path";
}

//Navigating to /redirect will redirect you to the result of getPath
<Route path="/redirect" element={<Navigate href={getPath}/>}/>
```

On the server, if a `Navigate` component is rendered, it will return an HTTP redirect response to let the browser handle the redirect. This also with SEO in mind, as it will let search engines know that the page has moved.
