'use client';

import { useRestaurant } from '../context/RestaurantContext';
import { plural } from '../lib/modules';

/** Cómo llama este negocio a quien le compra: "Cliente", "Paciente" o "Tutor" (de `verticalConfig.labels`). */
export function useCustomerLabels() {
  const { activePlace } = useRestaurant();
  const label = activePlace?.verticalConfig?.labels.customer ?? 'Cliente';
  const customer = label.toLowerCase();
  return { label, customer, customers: plural(customer) };
}
