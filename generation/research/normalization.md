

Combining diacritics:
 * http://en.wikipedia.org/wiki/Unicode_equivalence
   * Canonically equivalent -> n + ◌̃ = ñ  (Same display, printing, meaning)
   * Compatible: ligatures ﬀ = ff (Same is some apps - sorting, indexing)
 * Unicode normalization - replaces equivalent sequences.
   * There some equivalent characters (angstrom = 00C5 and 212B)
   * Combining vs precomposed characters (ligatures, combining)
   * Typographical conventions: ① is compatible with 1
 * There are 4 normal forms to compare/search for strings: 
   * Canonical(NF)/Compatibility(NFK) equivalence (chosen semantically, canonical = strict, compatibility = relaxed)
   * Composed/Decomposed - doesn't matter, just choose one.
 * Forms are in http://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt (http://en.wikipedia.org/wiki/Character_property_(Unicode))
 * http://unicode.org/reports/tr15/ - Normalization & Equivalence.
 * http://www.icu-project.org/docs/papers/optimized_unicode_composition_and_decomposition.html
 * Algorithms: http://www.unicode.org/versions/Unicode6.3.0/ch03.pdf
   * TR15 Part 8: Legacy encodings - about how to convert from/to other encodings.
 
 * There's a Node.js unicode normalization library 'unorm'

 * http://en.wikipedia.org/wiki/Combining_diacritical_mark
 * If several combining codes, in canonical they should be stable sorted in order of combining class.
 * There's a `quick check` flags http://unicode.org/faq/normalization.html
   * We can check before encoding/decoding that the char is in needed form.
 * There's also a complex combining alg-m for Korean 'Hangul' 'Jamo', through 3 tables.
 * Combining diacritical: 0x300-0x36F, 0x591-0x5C7, 0x610-0x61A, 0x64B-0x065F,  some others.
 * Encodings containing: 864, 874, 1046, 1129, 1133, 1161-1163, 1255, 1256, 1258, 8859-6, 8859-11, TCVN, MacThai (mostly TCVN, 1258, 1255)
 * Even for single-byte encodings I need (when there are combining chars):
   * Composing when decoding.
   * Decomposing when encoding.


=================================================
SBCS fast alg-m fails (see http://www.icu-project.org/docs/papers/optimized_unicode_composition_and_decomposition.html as inspiration):
 * If combined char is in encoding, then un-combined is also there:
   * CP866: Її

