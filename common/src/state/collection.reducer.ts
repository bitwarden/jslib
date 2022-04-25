import { createReducer, on } from "@ngrx/store";

import * as FolderActions from "./folders.actions";

export const collectionFeatureKey = "collection";

export interface State {
  loaded: boolean;
  ids: string[];
}

const initialState: State = {
  loaded: false,
  ids: [],
};

export const reducer = createReducer(
  initialState,
  on(FolderActions.loadBooksSuccess, (_state, { folders }) => ({
    loaded: true,
    ids: folders.map((f) => f.id),
  })),
  /**
   * Optimistically add book to collection.
   * If this succeeds there's nothing to do.
   * If this fails we revert state by removing the book.
   *
   * `on` supports handling multiple types of actions
   */
  on(FolderActions.addFolder, (state, { folder }) => {
    if (state.ids.indexOf(folder.id) > -1) {
      return state;
    }
    return {
      ...state,
      ids: [...state.ids, folder.id],
    };
  }),
  /**
   * Optimistically remove book from collection.
   * If addBook fails, we "undo" adding the book.
   */
  on(FolderActions.removeFolder, (state, { folder }) => ({
    ...state,
    ids: state.ids.filter((id) => id !== folder.id),
  }))
);

export const getLoaded = (state: State) => state.loaded;

export const getIds = (state: State) => state.ids;
