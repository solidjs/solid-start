export default function App() {
  const handleClick = (e: Event) => {
    // e.preventDefault();

    window.location.href = "/api/text-plain";
  };

  return (
    <main>
      <a href="/api/text-plain" onClick={handleClick}>
        Text Plain Response
      </a>
    </main>
  );
}
