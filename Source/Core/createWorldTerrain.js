define([
        './CesiumTerrainProvider',
        './defaultValue',
        './IonResource'
    ], function(
        CesiumTerrainProvider,
        defaultValue,
        IonResource) {
    'use strict';

    /**
     * Creates a {@link CesiumTerrainProvider} instance for the Cesium World Terrain.
     *
     * @exports createWorldTerrain
     *
     * @param {Boolean} [options.requestVertexNormals=true] Flag that indicates if the client should request additional lighting information from the server, in the form of per vertex normals if available.
     * @param {Boolean} [options.requestWaterMask=true] Flag that indicates if the client should request per tile water masks from the server,  if available.
     * @returns {CesiumTerrainProvider}
     *
     * @see Ion
     */
    function createWorldTerrain(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        return new CesiumTerrainProvider({
            url: IonResource.fromAssetId(1),
            requestVertexNormals: defaultValue(options.requestVertexNormals, true),
            requestWaterMask: defaultValue(options.requestWaterMask, true)
        });
    }

    return createWorldTerrain;
});
