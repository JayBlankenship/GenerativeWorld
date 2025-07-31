// TerrainPlane.js
import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

export class TerrainPlane {
    constructor(gridX, gridZ, scene, planeSize, planeGeometry, planeMaterial) {
        this.gridX = gridX;
        this.gridZ = gridZ;
        this.scene = scene; // Store the scene reference
        this.planeSize = planeSize; // Store planeSize for use in generateBlocks
        this.position = new THREE.Vector3(gridX * planeSize, 0, gridZ * planeSize);
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        // Placeholder for future procedural generation (e.g., height, texture)
        this.terrainData = {
            height: 0, // Default flat plane, can be modified later
            // Add more properties (e.g., noise, features) as needed
        };

        // --- Blocky neon terrain generation ---
        this.blockGroup = new THREE.Group();
        // Add blockGroup directly to the scene for proper rendering
        this.scene.add(this.blockGroup);
        this.generateBlocks();
        
        // Removed cached wireframe geometry (fixes black screen)
    }

    // Generate a random stack of neon blocks to make the terrain hilly/mountainous
    generateBlocks() {
        // DEBUG: Log block generation for troubleshooting
        console.log(`[TerrainPlane] Generating neon blocks for plane at (${this.gridX}, ${this.gridZ})`);
        // Remove previous blocks if any
        while (this.blockGroup.children.length > 0) {
            const child = this.blockGroup.children[0];
            this.blockGroup.remove(child);
        }

        // Parameters for a lower density layer of blocks covering the tile
        const gridCells = 4; // 4x4 grid for better performance
        const blockSize = this.planeSize / gridCells; // Each block fits perfectly
        const blockColor = 0x00fff7; // Neon cyan

        // InstancedMesh for solid cubes (for performance)
        const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
        const blockMaterial = new THREE.MeshBasicMaterial({
            color: blockColor,
            transparent: true,
            opacity: 0.18,
            wireframe: false
        });
        const instanceCount = gridCells * gridCells;
        const instancedMesh = new THREE.InstancedMesh(blockGeometry, blockMaterial, instanceCount);
        let i = 0;
        for (let x = 0; x < gridCells; x++) {
            for (let z = 0; z < gridCells; z++) {
                const matrix = new THREE.Matrix4();
                matrix.setPosition(
                    this.position.x + (x - gridCells / 2 + 0.5) * blockSize,
                    this.position.y + blockSize / 2 + 0.01,
                    this.position.z + (z - gridCells / 2 + 0.5) * blockSize
                );
                instancedMesh.setMatrixAt(i, matrix);
                i++;
            }
        }
        this.blockGroup.add(instancedMesh);

        // Generate wireframes with correct block size for each tile
        const combinedGeometry = new THREE.BufferGeometry();
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: blockColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.95
        });
        let positions = [];
        for (let x = 0; x < gridCells; x++) {
            for (let z = 0; z < gridCells; z++) {
                const edgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(blockSize, blockSize, blockSize));
                const edges = edgesGeometry.attributes.position.array;
                // Offset each block's wireframe to its world position
                const offsetX = this.position.x + (x - gridCells / 2 + 0.5) * blockSize;
                const offsetY = this.position.y + blockSize / 2 + 0.01;
                const offsetZ = this.position.z + (z - gridCells / 2 + 0.5) * blockSize;
                for (let i = 0; i < edges.length; i += 3) {
                    positions.push(edges[i] + offsetX, edges[i + 1] + offsetY, edges[i + 2] + offsetZ);
                }
            }
        }
        combinedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const combinedWireframe = new THREE.LineSegments(combinedGeometry, edgesMaterial);
        this.blockGroup.add(combinedWireframe);
    }

    // Method to update terrain (optional, for future use)
    updateTerrain() {
        // Future implementation for random generation
    }

    remove() {
        this.scene.remove(this.mesh); // Remove the plane
        if (this.blockGroup) {
            this.scene.remove(this.blockGroup); // Remove the blocks
        }
    }
}