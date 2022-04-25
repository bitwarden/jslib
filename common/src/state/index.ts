import { createSelector, createFeatureSelector } from "@ngrx/store";

import * as fromCollection from "./collection.reducer";
import { Folder } from "./folder";
import * as fromBooks from "./folders.reducer";

export interface State {
  [fromBooks.foldersFeatureKey]: fromBooks.State;
  [fromCollection.collectionFeatureKey]: fromCollection.State;
}

export const reducers = {
  [fromBooks.foldersFeatureKey]: fromBooks.reducer,
  [fromCollection.collectionFeatureKey]: fromCollection.reducer,
};

export const selectFoldersState = createFeatureSelector<State>(fromBooks.foldersFeatureKey);

export const selectFolderEntitiesState = createSelector(
  selectFoldersState,
  (state) => state.folders
);

export const {
  selectIds: selectFolderIds,
  selectEntities: selectFolderEntities,
  selectAll: selectAllFolders,
  selectTotal: selectTotalFolders,
} = fromBooks.adapter.getSelectors(selectFolderEntitiesState);

export const selectCollectionState = createSelector(
  selectFoldersState,
  (state) => state.collection
);

export const selectCollectionFolderIds = createSelector(
  selectCollectionState,
  fromCollection.getIds
);

export const selectFolderCollection = createSelector(
  selectFolderEntities,
  selectCollectionFolderIds,
  (entities, ids) => {
    return ids.map((id) => entities[id]).filter((folder): folder is Folder => folder != null);
  }
);
