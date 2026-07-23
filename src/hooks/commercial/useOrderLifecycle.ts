/**
 * Order Lifecycle Orchestrator — barrel (AUD-37)
 * Módulo refatorado em orderLifecycle/*
 */
export type { OrderItemLike, OrderLike } from './orderLifecycle/types';
export { useOrderLifecycle } from './orderLifecycle/useOrderLifecycle';
export { checkProductionCompletion } from './orderLifecycle/productionCheck';
