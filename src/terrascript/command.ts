import { Command } from '../command/command';
import { IContext } from '../interfaces/context';
import { expandTemplate } from '../template/template';

/**
 * @param context
 * @param command
 */
function expandCommand(context: IContext, command: Command): Command {
    const commandString = command.toString().toString();
    const expandedCommandString = expandTemplate(context, commandString);
    const expandedCommand = Command.fromString(expandedCommandString, command.options);
    return expandedCommand;
}

/**
 * @param context
 * @param command
 */
export async function expandAndRunCommand(context: IContext, command: Command) {
    const expandedCommand = expandCommand(context, command);
    return expandedCommand.run();
}
