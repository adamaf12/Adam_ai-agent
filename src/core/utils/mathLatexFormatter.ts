/**
 * High-performance LaTeX and Mathematical Step Formatter
 * Converts raw LaTeX expressions (\times, \approx, \frac, \sqrt, etc.)
 * into clear, orderly, and beautifully rendered mathematical notation for reading.
 */

export function formatMathAndLatex(content: string): string {
  if (!content) return '';

  // 1. Protect code blocks (inline and multiline) from LaTeX replacement
  const codeBlocks: string[] = [];
  const placeholderPrefix = '___MATH_PROTECTED_BLOCK_';
  let protectedText = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `${placeholderPrefix}${idx}___`;
  });

  // 2. Format display block equations: $$ ... $$
  protectedText = protectedText.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_match, eq) => {
    const cleanedEq = cleanLatexSymbols(eq.trim());
    return `\n\n> 📐 **معادلة / حساب:** ${cleanedEq}\n\n`;
  });

  // 3. Format inline math: $ ... $
  protectedText = protectedText.replace(/\$([^\$\n]+)\$/g, (_match, inner) => {
    return cleanLatexSymbols(inner.trim());
  });

  // 4. Format any remaining raw LaTeX symbols in regular text
  protectedText = cleanLatexSymbols(protectedText);

  // 5. Restore protected code blocks
  protectedText = protectedText.replace(new RegExp(`${placeholderPrefix}(\\d+)___`, 'g'), (_, idx) => {
    return codeBlocks[Number(idx)] || '';
  });

  return protectedText;
}

/**
 * Cleans and transforms raw LaTeX math macros into unicode math symbols
 */
function cleanLatexSymbols(input: string): string {
  return input
    // Multiplication, Division, Approximation, Arithmetic
    .replace(/\\times\b/g, '×')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mp\b/g, '∓')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\bullet\b/g, '•')
    .replace(/\\ast\b/g, '*')
    .replace(/\\star\b/g, '★')

    // Relations & Comparisons
    .replace(/\\neq\b/g, '≠')
    .replace(/\\ne\b/g, '≠')
    .replace(/\\leq\b/g, '≤')
    .replace(/\\le\b/g, '≤')
    .replace(/\\geq\b/g, '≥')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\ll\b/g, '≪')
    .replace(/\\gg\b/g, '≫')
    .replace(/\\equiv\b/g, '≡')
    .replace(/\\sim\b/g, '∼')
    .replace(/\\simeq\b/g, '≃')
    .replace(/\\cong\b/g, '≅')
    .replace(/\\propto\b/g, '∝')

    // Arrows & Logic
    .replace(/\\to\b/g, '→')
    .replace(/\\rightarrow\b/g, '→')
    .replace(/\\leftarrow\b/g, '←')
    .replace(/\\Rightarrow\b/g, '⇒')
    .replace(/\\Leftarrow\b/g, '⇐')
    .replace(/\\Leftrightarrow\b/g, '⇔')
    .replace(/\\iff\b/g, '⟺')
    .replace(/\\implies\b/g, '⟹')
    .replace(/\\forall\b/g, '∀')
    .replace(/\\exists\b/g, '∃')
    .replace(/\\neg\b/g, '¬')

    // Sets & Calculus
    .replace(/\\infty\b/g, '∞')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\subseteq\b/g, '⊆')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\emptyset\b/g, '∅')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\int\b/g, '∫')
    .replace(/\\partial\b/g, '∂')
    .replace(/\\nabla\b/g, '∇')

    // Angles & Units
    .replace(/\\degree\b/g, '°')
    .replace(/\^\\circ\b/g, '°')

    // Greek Alphabet
    .replace(/\\pi\b/g, 'π')
    .replace(/\\Pi\b/g, 'Π')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\Theta\b/g, 'Θ')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Gamma\b/g, 'Γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\epsilon\b/g, 'ε')
    .replace(/\\varepsilon\b/g, 'ε')
    .replace(/\\zeta\b/g, 'ζ')
    .replace(/\\eta\b/g, 'η')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\Lambda\b/g, 'Λ')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\xi\b/g, 'ξ')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\Sigma\b/g, 'Σ')
    .replace(/\\tau\b/g, 'τ')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\Phi\b/g, 'Φ')
    .replace(/\\psi\b/g, 'ψ')
    .replace(/\\Psi\b/g, 'Ψ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Omega\b/g, 'Ω')

    // Fractions: \frac{a}{b} -> (a / b)
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)')

    // Roots: \sqrt{x} -> √(x), \sqrt[n]{x} -> ⁿ√(x)
    .replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '$1√($2)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')

    // Formatting & font macros
    .replace(/\\(?:text|mathbf|mathrm|mathit|textbf|textit)\{([^{}]+)\}/g, '$1')
    .replace(/\\left\s*([(\[{|])/g, '$1')
    .replace(/\\right\s*([)\]}|])/g, '$1')
    .replace(/\\quad\b/g, '  ')
    .replace(/\\qquad\b/g, '    ')
    .replace(/\\,/g, ' ')

    // Common numeric superscripts
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\^0\b/g, '⁰')
    .replace(/\^1\b/g, '¹')
    .replace(/\^4\b/g, '⁴')
    .replace(/\^5\b/g, '⁵')
    .replace(/\^6\b/g, '⁶')
    .replace(/\^7\b/g, '⁷')
    .replace(/\^8\b/g, '⁸')
    .replace(/\^9\b/g, '⁹')
    .replace(/\^n\b/g, 'ⁿ')
    .replace(/\^x\b/g, 'ˣ')
    .replace(/\^y\b/g, 'ʸ')
    .replace(/\^-1\b/g, '⁻¹')

    // Common numeric subscripts
    .replace(/_0\b/g, '₀')
    .replace(/_1\b/g, '₁')
    .replace(/_2\b/g, '₂')
    .replace(/_3\b/g, '₃')
    .replace(/_4\b/g, '₄')
    .replace(/_5\b/g, '₅')
    .replace(/_n\b/g, 'ₙ')
    .replace(/_i\b/g, 'ᵢ')
    .replace(/_x\b/g, 'ₓ');
}
