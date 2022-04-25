import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";
import { createReducer, on } from "@ngrx/store";

import { Folder } from "./folder";
import * as FolderActions from "./folders.actions";

export const foldersFeatureKey = "folders";

export type State = EntityState<Folder>

export const adapter: EntityAdapter<Folder> = createEntityAdapter<Folder>({
  sortComparer: false,
});

export const initialState: State = adapter.getInitialState({});

export const reducer = createReducer(
  initialState,
  on(FolderActions.loadBooksSuccess, (state, { folders }) => adapter.addMany(folders, state))
);
