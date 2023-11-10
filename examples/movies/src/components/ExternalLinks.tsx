import { Show } from "solid-js";
import FacebookIcon from "~icons/ant-design/facebook-outlined";
import InstagramIcon from "~icons/ant-design/instagram-outline";
import LinkIcon from "~icons/ant-design/link-outlined";
import TwitterIcon from "~icons/ant-design/twitter-outlined";
import IMDBIcon from "~icons/fa-brands/imdb";

type Props = {
  media?: string;
  links: {
    twitter_id?: string;
    facebook_id?: string;
    instagram_id?: string;
    imdb_id?: string;
    homepage?: string;
  };
};

export function ExternalLinks(props: Props) {
  const { links } = props;

  return (
    <ul class="nolist">
      <Show when={links.twitter_id}>
        <li>
          <a
            href={`https://twitter.com/${links.twitter_id}`}
            target="_blank"
            aria-label="Twitter account"
            rel="noopener"
          >
            <TwitterIcon width={24} height={24} />
          </a>
        </li>
      </Show>

      <Show when={links.facebook_id}>
        <li>
          <a
            href={`https://facebook.com/${links.facebook_id}`}
            target="_blank"
            aria-label="Facebook account"
            rel="noopener"
          >
            <FacebookIcon width={24} height={24} />
          </a>
        </li>
      </Show>

      <Show when={links.instagram_id}>
        <li>
          <a
            href={`https://instagram.com/${links.instagram_id}`}
            target="_blank"
            aria-label="Instagram account"
            rel="noopener"
          >
            <InstagramIcon width={24} height={24} />
          </a>
        </li>
      </Show>

      <Show when={links.imdb_id}>
        <li>
          <a
            href={`https://www.imdb.com/${props.media === "person" ? "name" : "title"}/${
              links.imdb_id
            }`}
            target="_blank"
            aria-label="IMDb account"
            rel="noopener"
          >
            <IMDBIcon width={24} height={24} />
          </a>
        </li>
      </Show>

      <Show when={links.homepage}>
        <li>
          <a href={links.homepage} target="_blank" aria-label="Homepage" rel="noopener">
            <LinkIcon width={24} height={24} />
          </a>
        </li>
      </Show>
    </ul>
  );
}
