import _ from 'lodash';
import { Command, CommandOptions } from '../../../command/src/command/command';
import { IContext } from '../interfaces/context';
import { expandTemplate } from '../template/template';
import { ExitCode, Hash } from '../interfaces/types';

/**
 * Class containing static methods related to expanding template expressions before running
 * commands.
 */
export class Expand {
    /**
     * Public static method for the class which orchestrates expanding and running a command.
     *
     * @param {IContext} context - Context to be used for template expressions
     * @param {Command} command - Input command possibly containing template expressions
     * @returns {Promise<ExitCode>} - Command exit code
     */
    static async expandAndRunCommand(context: IContext, command: Command): Promise<ExitCode> {
        const expandedCommand = Expand.command(context, command);
        return expandedCommand.run();
    }

    /**
     * Expand the template expressions in a command
     *
     * @param {IContext} context - Context to be used for template expressions
     * @param {Command} command - Input command possibly containing template expressions
     * @returns {Command} A new command instance with template expressions evaluated
     * @private
     */
    private static command(context: IContext, command: Command): Command {
        const commandString = command.toString().toString();
        const expandedCommandString = expandTemplate(context, commandString);
        const expandedCommandOptions = Expand.options(context, command.options);
        return Command.fromString(expandedCommandString, expandedCommandOptions);
    }

    /**
     * Expand the template expressions in options
     *
     * @param {IContext} context - Context to be used for template expressions
     * @param {CommandOptions} options - Input options possibly containing template expressions
     * @returns {CommandOptions} A new options instance with template expressions evaluated
     * @private
     */
    private static options(context: IContext, options: CommandOptions): CommandOptions {
        const clone = _.cloneDeep(options);
        return Expand.hash(context, clone);
    }

    /**
     * Recursively expand any template expressions in a hash
     *
     * @param {IContext} context - Context to be used for template expressions
     * @param {any} obj - A hash (or string if in recursion)
     * @returns {any} - Hash with any template expressions evaluated
     * @private
     */
    private static hash(context: IContext, obj: any): any {
        if (_.isString(obj)) {
            return expandTemplate(context, obj);
        }
        if (_.isObject(obj) && !_.isFunction(obj) && !_.isArray(obj) && !_.isUndefined(obj)) {
            const clone = _.cloneDeep(obj) as Hash<any>;
            for (const key of Object.keys(clone)) {
                clone[key] = Expand.hash(context, clone[key]);
            }
            return clone;
        }
        return obj;
    }
}
