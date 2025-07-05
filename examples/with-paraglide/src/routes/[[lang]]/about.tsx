import { Title } from "@solidjs/meta";
import { useLang } from "~/lang/core";

export default function About() {
  const { messages } = useLang();

  return (
    <>
      <Title>About</Title>

      <h1>{messages().menu_about()}</h1>

      {/* Example of using multiple message parameters */}
      <p>
        {messages().example_name({
          firstname: "Paraglide",
          lastname: "JS"
        })}
      </p>

      {/* About content */}
      <p>
        {messages().about_content()}
      </p>

      {/* Features section */}
      <h2>
        {messages().features_title()}
      </h2>
      <div class="container">
        <ul>
          <li>{messages().feature_auto_detection()}</li>
          <li>{messages().feature_url_routing()}</li>
          <li>{messages().feature_type_safe()}</li>
          <li>{messages().feature_fast_lightweight()}</li>
          <li>{messages().feature_seo_friendly()}</li>
        </ul>
      </div>
    </>
  );
}
