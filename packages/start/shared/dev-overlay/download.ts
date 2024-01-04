export default function download(dataurl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataurl;
  link.download = filename;
  link.click();
}
