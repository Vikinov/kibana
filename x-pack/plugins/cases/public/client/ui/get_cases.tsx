/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiLoadingSpinner } from '@elastic/eui';
import React, { lazy, Suspense } from 'react';
import type { CasesProps } from '../../components/app';
import { CasesProvider, CasesContextProps } from '../../components/cases_context';

type GetCasesPropsInternal = CasesProps & CasesContextProps;
export type GetCasesProps = Omit<GetCasesPropsInternal, 'externalReferenceAttachmentTypeRegistry'>;

const CasesRoutesLazy: React.FC<CasesProps> = lazy(() => import('../../components/app/routes'));

export const getCasesLazy = ({
  externalReferenceAttachmentTypeRegistry,
  owner,
  userCanCrud,
  basePath,
  onComponentInitialized,
  actionsNavigation,
  ruleDetailsNavigation,
  showAlertDetails,
  useFetchAlertData,
  refreshRef,
  timelineIntegration,
  features,
  releasePhase,
}: GetCasesPropsInternal) => (
  <CasesProvider
    value={{
      externalReferenceAttachmentTypeRegistry,
      owner,
      userCanCrud,
      basePath,
      features,
      releasePhase,
    }}
  >
    <Suspense fallback={<EuiLoadingSpinner />}>
      <CasesRoutesLazy
        onComponentInitialized={onComponentInitialized}
        actionsNavigation={actionsNavigation}
        ruleDetailsNavigation={ruleDetailsNavigation}
        showAlertDetails={showAlertDetails}
        useFetchAlertData={useFetchAlertData}
        refreshRef={refreshRef}
        timelineIntegration={timelineIntegration}
      />
    </Suspense>
  </CasesProvider>
);
