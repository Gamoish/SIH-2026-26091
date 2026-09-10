'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PlusSignIcon,
  PrinterIcon,
  Location01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  File02Icon,
  Analytics01Icon,
  Download01Icon,
  Home05Icon,
  Settings02Icon,
  Globe02Icon,
  SmartPhone01Icon,
  UserCircleIcon,
  HelpCircleIcon,
  Logout01Icon,
  Camera01Icon,
} from '@hugeicons/core-free-icons';

/**
 * The desktop icon vocabulary: one mark per concept, one library, one weight.
 *
 * Before this, the four desktop pages drew icons two ways. The rail and the
 * settings rows used Hugeicons; everything else - the back arrow, the print
 * control, the plus on both "start a check" panels, the three summary glyphs
 * on the applications list, the location pin, the three next-step marks - was
 * hand-written <path> data inline. So the same idea was drawn twice by
 * different hands: the document on a filed row and the document on the tile
 * counting those rows were two different drawings, and the plus on the
 * dashboard and the plus on the applications list were two more.
 *
 * Keys are concepts rather than shapes on purpose. `complete` is what a
 * finished thing gets, wherever it is; a caller asking for a tick has to ask
 * for the meaning, which is what stops the same glyph being used decoratively
 * somewhere it means nothing.
 *
 * Stroke weight is fixed at 2 here and is not a prop. It was 1.9, 2, 2.1, 2.2,
 * 2.4 and 2.6 across the pages, which is invisible per icon and obvious in a
 * column of them. Size stays a prop because an icon in a 38px settings circle
 * and one inside a text line are genuinely different sizes.
 */
export const ICONS = {
  /** A filed application, or the report behind one. */
  filed: File02Icon,
  /** Finished - a completed filing, a section the full report really covers. */
  complete: CheckmarkCircle02Icon,
  /** Waiting: a draft not yet finished. */
  pending: Clock01Icon,
  /** Start a check. */
  add: PlusSignIcon,
  /** Print, or save as PDF. */
  print: PrinterIcon,
  /** Where a check is. */
  place: Location01Icon,
  /** Back to the screen behind this one. */
  back: ArrowLeft01Icon,
  /** Onward to the screen this row opens. */
  next: ArrowRight01Icon,
  /** The repayment plan - instalments over time. */
  plan: Analytics01Icon,
  /** The one-page summary, to save and take somewhere. */
  bank: Download01Icon,
  home: Home05Icon,
  settings: Settings02Icon,
  language: Globe02Icon,
  phone: SmartPhone01Icon,
  account: UserCircleIcon,
  help: HelpCircleIcon,
  logout: Logout01Icon,
  /** Change the profile photo. */
  camera: Camera01Icon,
} as const;

export type IconName = keyof typeof ICONS;

/**
 * `color` defaults to `currentColor`, so an icon takes the colour of whatever
 * it sits in - a tinted square sets `color` once and the glyph follows,
 * instead of every caller repeating the token.
 */
export function Icon({
  name,
  size = 20,
  color = 'currentColor',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <HugeiconsIcon icon={ICONS[name]} size={size} color={color} strokeWidth={2} />;
}
