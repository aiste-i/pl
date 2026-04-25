# XPath Cleanup Benchmark-Risk Note

The risky cases in this cleanup were XPath rows that had become different from CSS mainly by leaning on exact copy, normalized visible strings, placeholder text, or similar content-facing anchors even though the UI already exposed a stronger structural or contextual contract.

This cleanup did three things:

- moved button, navbar, feed-tab, and title rows off text-driven XPath variants when the relational or structural contract was already available;
- kept XPath distinct where the distinction is now expressed through ancestor/descendant context, repeated-container predicates, or form ownership;
- accepted honest overlap when the earlier divergence was not methodologically defensible.

Reviewed suspicious rows: 27. Remaining justified content-heavy rows: 1.

The benchmark is therefore harder to criticize on the specific claim that XPath was made artificially weak by copy-sensitive rewrites. Remaining limitations are still real: some rows now overlap more closely with CSS than before, and a small number of fields may still rely on accessibility-facing contracts when those contracts are genuinely the most stable element identity available in that app.

Remaining justified content-heavy rows:

- vue3-realworld-example-app :: settings.bioInput
