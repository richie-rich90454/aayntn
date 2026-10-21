import type { ThemeRegistration } from 'shiki'

/**
 * The aayntn code theme.
 *
 * A restrained surface: the architectural frame around a code panel carries
 * the visual weight, so the code itself only needs enough hue to make tokens
 * distinguishable at a glance.
 *
 * Ordinary code  #161616   Keywords   #2847B8   Types   #7B274B
 * Functions      #225B45   Numbers    #A34A20   Strings #7B274B
 * Comments       #626C78   Gutter     #767E8D
 */
export const aayntnLight: ThemeRegistration = {
  name: 'aayntn-light',
  type: 'light',
  colors: {
    'editor.background': '#F5F7FC',
    'editor.foreground': '#161616',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#626C78', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator'],
      settings: { foreground: '#2847B8' },
    },
    {
      scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'],
      settings: { foreground: '#7B274B' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#225B45' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character'],
      settings: { foreground: '#A34A20' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: '#7B274B' },
    },
    {
      scope: ['variable', 'variable.parameter', 'variable.other', 'meta.definition.variable.name'],
      settings: { foreground: '#161616' },
    },
    { scope: ['entity.name.namespace', 'entity.name.type.struct'], settings: { foreground: '#593399' } },
    { scope: ['punctuation', 'meta.brace', 'meta.delimiter'], settings: { foreground: '#161616' } },
    { scope: ['meta.annotation', 'storage.type.annotation'], settings: { foreground: '#7B274B' } },
    { scope: ['invalid'], settings: { foreground: '#C63D32' } },
  ],
}

/** Dark-mode variant. Contrast was checked against the dark code canvas. */
export const aayntnDark: ThemeRegistration = {
  name: 'aayntn-dark',
  type: 'dark',
  colors: {
    'editor.background': '#101418',
    'editor.foreground': '#F2F4F8',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#8A94A6', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator'],
      settings: { foreground: '#8FA9F0' },
    },
    {
      scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'],
      settings: { foreground: '#E0A6C4' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#79D2AE' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character'],
      settings: { foreground: '#E9A06B' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: '#E0A6C4' },
    },
    {
      scope: ['variable', 'variable.parameter', 'variable.other', 'meta.definition.variable.name'],
      settings: { foreground: '#F2F4F8' },
    },
    { scope: ['entity.name.namespace', 'entity.name.type.struct'], settings: { foreground: '#BFA6F5' } },
    { scope: ['punctuation', 'meta.brace', 'meta.delimiter'], settings: { foreground: '#F2F4F8' } },
    { scope: ['meta.annotation', 'storage.type.annotation'], settings: { foreground: '#E0A6C4' } },
    { scope: ['invalid'], settings: { foreground: '#F08A80' } },
  ],
}
