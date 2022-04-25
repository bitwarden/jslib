import { createAction, props } from "@ngrx/store";

import { Folder } from "./folder";

export const addFolder = createAction("[AddEdit Folder] Add Folder", props<{ folder: Folder }>());

export const editFolder = createAction("[AddEdit Folder] Edit Folder", props<{ folder: Folder }>());

export const removeFolder = createAction(
  "[AddEdit Folder] Remove Folder",
  props<{ folder: Folder }>()
);

export const loadBooksSuccess = createAction(
  "[Sync API] Loaded Folders Success",
  props<{ folders: Folder[] }>()
);
