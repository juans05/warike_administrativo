import type { ReactNode, TdHTMLAttributes } from 'react';
import { cn, Skeleton } from '../ui';

type Column = string | { label: string; align?: 'right' };

/** Tabla densa del admin de plataforma. Quien la usa decide el estado vacío y el de carga. */
export function Table({ columns, children }: { columns: Column[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-background text-xs text-text-muted">
          <tr>
            {columns.map((column) => {
              const { label, align } = typeof column === 'string' ? { label: column, align: undefined } : column;
              return (
                <th key={label} scope="col" className={cn('whitespace-nowrap px-4 py-2.5 font-medium', align === 'right' && 'text-right')}>
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="transition-colors duration-200 hover:bg-background motion-reduce:transition-none">{children}</tr>;
}

export function Td({ right, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { right?: boolean }) {
  return <td className={cn('px-4 py-3 align-middle text-text', right && 'text-right tabular-nums', className)} {...rest} />;
}

/** Relleno mientras carga una tabla o lista. */
export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}
