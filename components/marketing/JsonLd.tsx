/**
 * Renders a JSON-LD block.
 *
 * `dangerouslySetInnerHTML` is how Next documents emitting JSON-LD, and it is safe here: the
 * payload is built from this repo's own constants, never from user input. The `<` escape is
 * still applied, because a literal `</script>` inside a JSON string would end the element
 * early no matter where the string came from.
 *
 * Server-rendered, so crawlers that execute no JavaScript still read it.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
