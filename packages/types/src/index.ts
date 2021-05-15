export type Hash<T = string> = { [key: string]: T };

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [key: string] : JSONValue };
export type JSONArray = JSONValue[];
