// trouble maker
const location = window.document.location;

export default function BreaksOnServer() {
  return <div>Breaks on server {location.href}</div>
}