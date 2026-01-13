import type { Command } from '../../shared/interactions/commandRouter';
import { warn } from './commands/warn';
import { kick } from './commands/kick';
import { ban } from './commands/ban';
import { timeout } from './commands/timeout';
import { cases } from './commands/cases';

export const moderationModule: Command[] = [warn, kick, ban, timeout, cases];
