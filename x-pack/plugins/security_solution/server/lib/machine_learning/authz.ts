/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

import { Type } from '@kbn/securitysolution-io-ts-alerting-types';
import { KibanaRequest, SavedObjectsClientContract } from '@kbn/core/server';
import { ILicense } from '@kbn/licensing-plugin/server';
import { MlPluginSetup } from '@kbn/ml-plugin/server';
import { SetupPlugins } from '../../plugin';
import { MINIMUM_ML_LICENSE } from '../../../common/constants';
import { hasMlAdminPermissions } from '../../../common/machine_learning/has_ml_admin_permissions';
import { isMlRule } from '../../../common/machine_learning/helpers';
import { Validation } from './validation';
import { cache } from './cache';
export interface MlAuthz {
  validateRuleType: (type: Type) => Promise<Validation>;
}

/**
 * Builds ML authz services
 *
 * @param license A {@link ILicense} representing the user license
 * @param ml {@link MlPluginSetup} ML services to fetch ML capabilities
 * @param request A {@link KibanaRequest} representing the authenticated user
 *
 * @returns A {@link MLAuthz} service object
 */
export const buildMlAuthz = ({
  license,
  ml,
  request,
  savedObjectsClient,
}: {
  license: ILicense;
  ml: SetupPlugins['ml'];
  request: KibanaRequest;
  savedObjectsClient: SavedObjectsClientContract;
}): MlAuthz => {
  const cachedValidate = cache(() => validateMlAuthz({ license, ml, request, savedObjectsClient }));
  const validateRuleType = async (type: Type): Promise<Validation> => {
    if (!isMlRule(type)) {
      return { valid: true, message: undefined };
    } else {
      return cachedValidate();
    }
  };

  return { validateRuleType };
};

/**
 * Validates ML authorization for the current request
 *
 * @param license A {@link ILicense} representing the user license
 * @param ml {@link MlPluginSetup} ML services to fetch ML capabilities
 * @param request A {@link KibanaRequest} representing the authenticated user
 *
 * @returns A {@link Validation} validation
 */
export const validateMlAuthz = async ({
  license,
  ml,
  request,
  savedObjectsClient,
}: {
  license: ILicense;
  ml: SetupPlugins['ml'];
  request: KibanaRequest;
  savedObjectsClient: SavedObjectsClientContract;
}): Promise<Validation> => {
  let message: string | undefined;

  if (ml == null) {
    message = i18n.translate('xpack.securitySolution.authz.mlUnavailable', {
      defaultMessage: 'The machine learning plugin is not available. Try enabling the plugin.',
    });
  } else if (!hasMlLicense(license)) {
    message = i18n.translate('xpack.securitySolution.licensing.unsupportedMachineLearningMessage', {
      defaultMessage:
        'Your license does not support machine learning. Please upgrade your license.',
    });
  } else if (!(await isMlAdmin({ ml, request, savedObjectsClient }))) {
    message = i18n.translate('xpack.securitySolution.authz.userIsNotMlAdminMessage', {
      defaultMessage: 'The current user is not a machine learning administrator.',
    });
  }

  return {
    valid: message === undefined,
    message,
  };
};

/**
 * Whether the license allows ML usage
 *
 * @param license A {@link ILicense} representing the user license
 *
 */
export const hasMlLicense = (license: ILicense): boolean => license.hasAtLeast(MINIMUM_ML_LICENSE);

/**
 * Whether the requesting user is an ML Admin
 *
 * @param request A {@link KibanaRequest} representing the authenticated user
 * @param ml {@link MlPluginSetup} ML services to fetch ML capabilities
 *
 */
export const isMlAdmin = async ({
  request,
  savedObjectsClient,
  ml,
}: {
  request: KibanaRequest;
  savedObjectsClient: SavedObjectsClientContract;
  ml: MlPluginSetup;
}): Promise<boolean> => {
  const mlCapabilities = await ml.mlSystemProvider(request, savedObjectsClient).mlCapabilities();
  return hasMlAdminPermissions(mlCapabilities);
};
