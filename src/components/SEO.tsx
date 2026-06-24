import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
}

/**
 * Per-route SEO head tags. Pass `path` (e.g. "/pricing") so canonical
 * and og:url self-reference the current page instead of inheriting
 * the sitewide value from index.html.
 */
export const SEO = ({ title, description, path = "" }: SEOProps) => {
  const url = `https://www.clauthor.com${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default SEO;
