import { describe, expect, it } from 'vitest';
import {
  CHAT_CATALOG_VERSION,
  CHAT_REACTIONS,
  CHAT_TEMPLATES,
  getReaction,
  getTemplate,
} from './chatTemplates';

describe('Chat Templates and Reactions Catalog', () => {
  it('has valid catalog version', () => {
    expect(CHAT_CATALOG_VERSION).toBe(1);
  });

  it('contains curated templates across 5 distinct categories with full translations', () => {
    expect(CHAT_TEMPLATES.length).toBeGreaterThanOrEqual(12);

    const categories = new Set(CHAT_TEMPLATES.map((t) => t.category));
    expect(categories.has('greetings')).toBe(true);
    expect(categories.has('wellbeing')).toBe(true);
    expect(categories.has('daily_life')).toBe(true);
    expect(categories.has('activities')).toBe(true);
    expect(categories.has('encouragement_rest')).toBe(true);

    for (const template of CHAT_TEMPLATES) {
      expect(template.key).toBeTruthy();
      expect(template.text.English.length).toBeGreaterThan(5);
      expect(template.text.Hindi.length).toBeGreaterThan(5);
      expect(template.text.Assamese.length).toBeGreaterThan(5);

      expect(template.shortLabel.English.length).toBeGreaterThan(2);
      expect(template.shortLabel.Hindi.length).toBeGreaterThan(2);
      expect(template.shortLabel.Assamese.length).toBeGreaterThan(2);
    }
  });

  it('contains exactly 5 safe curated reactions with emojis and labels', () => {
    expect(CHAT_REACTIONS).toHaveLength(5);
    const codes = CHAT_REACTIONS.map((r) => r.code);
    expect(codes).toEqual(['wave', 'smile', 'heart', 'flower', 'tea']);

    for (const reaction of CHAT_REACTIONS) {
      expect(reaction.emoji).toBeTruthy();
      expect(reaction.label.English).toBeTruthy();
      expect(reaction.label.Hindi).toBeTruthy();
      expect(reaction.label.Assamese).toBeTruthy();
    }
  });

  it('retrieves templates and reactions correctly by key/code', () => {
    const hello = getTemplate('hello');
    expect(hello).toBeDefined();
    expect(hello?.key).toBe('hello');

    const wave = getReaction('wave');
    expect(wave).toBeDefined();
    expect(wave?.emoji).toBe('👋');

    expect(getTemplate('non_existent_key')).toBeUndefined();
    expect(getReaction('non_existent_code')).toBeUndefined();
  });
});
