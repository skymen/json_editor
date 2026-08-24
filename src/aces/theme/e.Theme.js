export const config = {
  id: "theme",
  returnType: "string",
  description:
    'The name of the current built-in theme, or "custom" when a stylesheet replaced it.',
};

export const expose = true;

export default function () {
  return this.themeName;
}
