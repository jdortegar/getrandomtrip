import type { ReactNode } from "react";

export interface TableFilterOption {
  label: string;
  value: string;
}

export interface TableFilterDefinition {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly TableFilterOption[];
  value: string;
}

export interface TableSearchDefinition {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

export interface TableFilterToolbarProps {
  actions?: ReactNode;
  copy: {
    clearFilters: string;
    count: string;
    loading: string;
    of: string;
  };
  filters: readonly TableFilterDefinition[];
  hasActiveFilters: boolean;
  hasError?: boolean;
  isLoading?: boolean;
  onClear: () => void;
  search?: TableSearchDefinition;
  shown: number;
  total: number;
}
