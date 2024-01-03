import * as shikiji from 'shikiji';
import { createEffect, createResource, type JSX } from 'solid-js';

let HIGHLIGHTER: shikiji.Highlighter;

async function loadHighlighter() {
  if (!HIGHLIGHTER) {
    HIGHLIGHTER = await shikiji.getHighlighter({
      themes: ['dark-plus'],
      langs: ['js', 'ts', 'jsx', 'tsx'],
    });
  }
  return HIGHLIGHTER;
}

export interface CodeViewProps {
  fileName: string;
  content: string;
  line: number;
}

const RANGE = 10;

export function CodeView(props: CodeViewProps): JSX.Element | null {
  const lines = () =>
    props.content.split('\n').map((item, index) => ({
      index: index + 1,
      line: item,
    }));

  const minLine = () => Math.max(props.line - (1 + RANGE), 0);
  const maxLine = () => Math.min(props.line + RANGE, lines().length - 1);

  let ref: HTMLDivElement | undefined;

  const [data] = createResource(() => (
    lines()
    .slice(minLine(), maxLine())
    .map(item => item.line)
    .join('\n')
  ) ,async (value) => {
    const highlighter = await loadHighlighter();
    const lang = props.fileName
      .split(/[#?]/)[0]
      .split('.')
      .pop()
      ?.trim() as shikiji.BuiltinLanguage;
    await highlighter.loadLanguage(lang);
    return highlighter.codeToHtml(value, {
      theme: 'dark-plus',
      lang,
    });
  });

  createEffect(() => {
    const result = data();
    if (ref && result) {
      ref.innerHTML = result;

      const lines = ref.querySelectorAll('span[class="line"]');

      for (let i = 0, len = lines.length; i < len; i++) {
        const el = lines[i];
        if ((props.line - minLine() - 1) === i) {
          el.innerHTML = `<mark style="background-color:#aaaaaa80">${el.innerHTML}</mark>`;
        }
      }
    }
  });

  return <div ref={ref} class="dev-overlay-code-view" style={{
    '--dev-overlay-code-view-start': minLine() + 1,
  }} />;
}
