export const config = {
  id: "action-button-id",
  returnType: "string",
  description: "The ID of the action button that was last pressed.",
};

export const expose = true;

export default function () {
  return this.lastActionId;
}
