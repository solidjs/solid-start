export function Component() {
  return <>hello</>;
}

export function Component2() {
  return <>hello</>;
}

export default function () {
  return <div>
    <Component/>
    <Component2/>
  </div>;
}
