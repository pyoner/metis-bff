const {
    insertUserDataSource,
    deleteUserDataSource,
    selectDataSourcesIdMap,
} = require('../../../services/db');
const { createDataSource, getDataSources, deleteDataSource } = require('../../../services/backend');

module.exports = {
    deleteAndClearDataSource,
    getAndPrepareDataSources,
    createAndSaveDataSource,
};

async function createAndSaveDataSource(userId, content, fmt, name) {
    const { data = {} } = await createDataSource(content, fmt, name);

    if (!data.uuid) {
        throw 'Data source UUID is not available';
    }

    return insertUserDataSource(userId, { uuid: data.uuid });
}

/**
 * Retrieves data sources from both local and remote sources and prepares
 * them for display.
 * @async
 * @function
 * @param {Object} datasources - The datasources object.
 * @param {Array<Object>} [datasources.data=[]] - The local data sources.
 * @returns {Promise<Object>} - The merged and prepared data sources.
 * @throws {Error} - If there is an error retrieving the remote data sources.
 * @example
 * const { data, total } = await getAndPrepareDataSources({ data: localDataSources });
 */
async function getAndPrepareDataSources({ data = [] }) {
    if (!data.length) return { data: [], total: 0 };

    // Map UUIDs to local data sources
    const localDataSourcesMap = new Map(data.map(({ uuid, ...otherProps }) => [uuid, otherProps]));

    // Retrieve remote data sources from backend
    const { data: remoteDataSources = [] } = await getDataSources(
        Array.from(localDataSourcesMap.keys())
    );
    if (!remoteDataSources.length) return [];

    // Retrieve mapping of UUIDs to local IDs for parents and children
    const relativeUUIDs = remoteDataSources.flatMap((x) => [
        ...(x.parents || []),
        ...(x.children || []),
    ]);
    const idToUUIDMap = await selectDataSourcesIdMap([], relativeUUIDs);
    const uuidToIDMap = new Map(Array.from(idToUUIDMap).map((x) => x.reverse()));

    // Merge remote and local data sources
    const merged = remoteDataSources.map(({ uuid, ...dataSource }) => ({
        ...dataSource,
        parents: (dataSource.parents || []).map((x) => uuidToIDMap.get(x)),
        children: (dataSource.children || []).map((x) => uuidToIDMap.get(x)),
        ...(localDataSourcesMap.get(uuid) || {}),
    }));
    return { data: merged, total: merged.length };
}

async function deleteAndClearDataSource(userId, id) {
    const { uuid } = await deleteUserDataSource(userId, id);
    await deleteDataSource(uuid);
    return uuid;
}
