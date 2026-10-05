/** Result returned by every form server action, consumed by <ActionForm>. */
export type ActionState = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
  at: number;
};
