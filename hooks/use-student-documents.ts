"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  STUDENT_DOCUMENT_TYPES,
  type StudentDocumentGroup,
  type StudentDocumentType,
  type UserFacingDocument,
  getDocumentKind,
} from "@/types/documents";

type StudentContractRow = {
  id: string;
  status: string;
  created_at: string;
  application_id: string | null;
  service_order_id: string | null;
  company_id: string | null;
};

type CompanyProfileRow = {
  user_id: string;
  nazwa: string | null;
};

type ContractDocumentRow = {
  id: string;
  contract_id: string;
  document_type: StudentDocumentType;
  file_name: string | null;
  storage_path: string | null;
  created_at: string | null;
  generated_at?: string | null;
};

type ApplicationTitleRow = {
  id: string;
  offers:
    | { tytul?: string | null }
    | Array<{ tytul?: string | null }>
    | null;
};

type ServiceOrderTitleRow = {
  id: string;
  package:
    | { title?: string | null }
    | Array<{ title?: string | null }>
    | null;
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getApplicationTitle(row: ApplicationTitleRow) {
  const offer = unwrapRelation(row.offers);
  return offer?.tytul || "Zlecenie";
}

function getServiceOrderTitle(row: ServiceOrderTitleRow) {
  const servicePackage = unwrapRelation(row.package);
  return servicePackage?.title || "Zlecenie bezposrednie";
}

function byCreatedAtDesc(left: { createdAt: string }, right: { createdAt: string }) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export function useStudentDocuments() {
  const [groups, setGroups] = useState<StudentDocumentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        setGroups([]);
        return;
      }

      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select("id, status, created_at, application_id, service_order_id, company_id")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (contractsError) {
        throw new Error(contractsError.message);
      }

      const contracts = (contractsData || []) as StudentContractRow[];
      if (contracts.length === 0) {
        setGroups([]);
        return;
      }

      const contractIds = contracts.map((contract) => contract.id);
      const applicationIds = contracts
        .map((contract) => contract.application_id)
        .filter((value): value is string => Boolean(value));
      const serviceOrderIds = contracts
        .map((contract) => contract.service_order_id)
        .filter((value): value is string => Boolean(value));
      const companyIds = Array.from(
        new Set(
          contracts
            .map((contract) => contract.company_id)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      const [documentsResult, companyProfilesResult, applicationsResult, serviceOrdersResult] =
        await Promise.all([
          supabase
            .from("contract_documents")
            .select("id, contract_id, document_type, file_name, storage_path, created_at, generated_at")
            .in("contract_id", contractIds)
            .in("document_type", [...STUDENT_DOCUMENT_TYPES])
            .order("created_at", { ascending: false }),
          companyIds.length
            ? supabase
                .from("company_profiles")
                .select("user_id, nazwa")
                .in("user_id", companyIds)
            : Promise.resolve({ data: [], error: null }),
          applicationIds.length
            ? supabase
                .from("applications")
                .select("id, offers(tytul)")
                .in("id", applicationIds)
            : Promise.resolve({ data: [], error: null }),
          serviceOrderIds.length
            ? supabase
                .from("service_orders")
                .select("id, package:service_packages(title)")
                .in("id", serviceOrderIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (documentsResult.error) throw new Error(documentsResult.error.message);
      if (companyProfilesResult.error) throw new Error(companyProfilesResult.error.message);
      if (applicationsResult.error) throw new Error(applicationsResult.error.message);
      if (serviceOrdersResult.error) throw new Error(serviceOrdersResult.error.message);

      const companyNames = new Map(
        ((companyProfilesResult.data || []) as CompanyProfileRow[]).map((profile) => [
          profile.user_id,
          profile.nazwa || "Firma",
        ]),
      );
      const applicationTitles = new Map(
        ((applicationsResult.data || []) as ApplicationTitleRow[]).map((application) => [
          application.id,
          getApplicationTitle(application),
        ]),
      );
      const serviceOrderTitles = new Map(
        ((serviceOrdersResult.data || []) as ServiceOrderTitleRow[]).map((serviceOrder) => [
          serviceOrder.id,
          getServiceOrderTitle(serviceOrder),
        ]),
      );

      const documentsWithUrls = ((documentsResult.data || []) as ContractDocumentRow[]).map((document) => ({
        ...document,
        downloadUrl: document.storage_path
          ? `/api/documents/download?documentId=${encodeURIComponent(document.id)}`
          : null,
      }));

      const grouped = contracts
        .map((contract) => {
          const title =
            (contract.application_id && applicationTitles.get(contract.application_id)) ||
            (contract.service_order_id && serviceOrderTitles.get(contract.service_order_id)) ||
            "Zlecenie";

          const counterpartName = contract.company_id
            ? companyNames.get(contract.company_id) || "Firma"
            : "Firma";

          const documents = documentsWithUrls
            .filter((document) => document.contract_id === contract.id)
            .map(
              (document): UserFacingDocument => ({
                id: document.id,
                contractId: contract.id,
                title,
                contractStatus: contract.status,
                counterpartName,
                type: document.document_type,
                kind: getDocumentKind(document.document_type),
                fileName: document.file_name || document.document_type,
                createdAt: document.created_at || document.generated_at || contract.created_at,
                downloadUrl: document.downloadUrl,
              }),
            )
            .sort((left, right) => byCreatedAtDesc(
              { createdAt: left.createdAt || contract.created_at },
              { createdAt: right.createdAt || contract.created_at },
            ));

          return {
            contractId: contract.id,
            title,
            contractStatus: contract.status,
            counterpartName,
            createdAt: contract.created_at,
            documents,
          };
        })
        .filter((group) => group.documents.length > 0)
        .sort(byCreatedAtDesc);

      setGroups(grouped);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nie udalo sie pobrac dokumentow.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    groups,
    isLoading,
    error,
    reload: load,
  };
}
