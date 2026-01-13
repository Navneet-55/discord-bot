import type { Command } from '../../shared/interactions/commandRouter';
import { ping } from './commands/ping';
import { health } from './commands/health';
import { config } from './commands/config';
import { feature } from './commands/feature';

export const coreModule: Command[] = [ping, health, config, feature];
