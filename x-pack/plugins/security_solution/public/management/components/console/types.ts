/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ComponentType } from 'react';
import type { CommonProps } from '@elastic/eui';
import { CommandExecutionResultComponent } from './components/command_execution_result';
import type { CommandExecutionState } from './components/console_state/types';
import type { Immutable, MaybeImmutable } from '../../../../common/endpoint/types';
import type { ParsedArgData, ParsedCommandInterface } from './service/parsed_command_input';

export interface CommandArgs {
  [longName: string]: {
    required: boolean;
    allowMultiples: boolean;
    exclusiveOr?: boolean;
    about: string;
    /**
     * Validate the individual values given to this argument.
     * Should return `true` if valid or a string with the error message
     */
    validate?: (argData: ParsedArgData) => true | string;

    // Selector: Idea is that the schema can plugin in a rich component for the
    // user to select something (ex. a file)
    // FIXME: implement selector
    selector?: ComponentType;
  };
}

export interface CommandDefinition<TMeta = any> {
  name: string;
  about: string;
  /**
   * The Component that will be used to render the Command
   */
  RenderComponent: CommandExecutionComponent;
  /**
   * If defined, this command's use of `--help` will be displayed using this component instead of
   * the console's built in output.
   */
  HelpComponent?: CommandExecutionComponent;
  /**
   * A store for any data needed when the command is executed.
   * The entire `CommandDefinition` is passed along to the component
   * that will handle it, so this data will be available there
   */
  meta?: TMeta;

  /** If all args are optional, but at least one must be defined, set to true */
  mustHaveArgs?: boolean;

  exampleUsage?: string;
  exampleInstruction?: string;

  /**
   * Validate the command entered by the user. This is called only after the Console has ran
   * through all of its builtin validations (based on `CommandDefinition`).
   * Example: used it when there are multiple optional arguments but at least one of those
   * must be defined.
   */
  validate?: (command: Command) => true | string;

  /** The list of arguments supported by this command */
  args?: CommandArgs;
}

/**
 * A command to be executed (as entered by the user)
 */
export interface Command<
  TDefinition extends CommandDefinition = CommandDefinition,
  TArgs extends object = any
> {
  /** The raw input entered by the user */
  input: string;
  // FIXME:PT this should be a generic that allows for the arguments type to be used
  /** An object with the arguments entered by the user and their value */
  args: ParsedCommandInterface<TArgs>;
  /** The command definition associated with this user command */
  commandDefinition: TDefinition;
}

export interface CommandExecutionComponentProps<
  /** The arguments that could have been entered by the user */
  TArgs extends object = any,
  /** Internal store for the Command execution */
  TStore extends object = Record<string, unknown>,
  /** The metadata defined on the Command Definition */
  TMeta = any
> {
  command: Command<CommandDefinition<TMeta>, TArgs>;

  /**
   * A data store for the command execution to store data in, if needed.
   * Because the Console could be closed/opened several times, which will cause this component
   * to be `mounted`/`unmounted` several times, this data store will be beneficial for
   * persisting data (ex. API response with IDs) that the command can use to determine
   * if the command has already been executed or if it's a new instance.
   */
  store: Immutable<Partial<TStore>>;

  /**
   * Sets the `store` data above. Function will be called the latest (prevState) store data
   */
  setStore: (
    updateStoreFn: (prevState: Immutable<Partial<TStore>>) => MaybeImmutable<TStore>
  ) => void;

  /**
   * The status of the command execution.
   * Note that the console's UI will show the command as "busy" while the status here is
   * `pending`. Ensure that once the action processing completes, that this is set to
   * either `success` or `error`.
   */
  status: CommandExecutionState['status'];

  /** Set the status of the command execution  */
  setStatus: (status: CommandExecutionState['status']) => void;

  /**
   * A component that can be used to format the returned result from the command execution.
   */
  ResultComponent: CommandExecutionResultComponent;
}

/**
 * The component that will handle the Command execution and display the result.
 */
export type CommandExecutionComponent<
  /** The arguments that could have been entered by the user */
  TArgs extends object = any,
  /** Internal store for the Command execution */
  TStore extends object = Record<string, unknown>,
  /** The metadata defined on the Command Definition */
  TMeta = any
> = ComponentType<CommandExecutionComponentProps<TArgs, TStore, TMeta>>;

export interface ConsoleProps extends CommonProps {
  /**
   * The list of Commands that will be available in the console for the user to execute
   */
  commands: CommandDefinition[];

  /**
   * If defined, then the `help` builtin command will display this output instead of the default one
   * which is generated out of the Command list.
   */
  HelpComponent?: CommandExecutionComponent;

  /**
   * A component to be used in the Console's header title area (left side)
   */
  TitleComponent?: ComponentType;

  prompt?: string;

  /**
   * For internal use only!
   * Provided by the ConsoleManager to indicate that the console is being managed by it
   * @private
   */
  managedKey?: symbol;
}
