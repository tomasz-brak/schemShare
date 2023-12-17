<script setup lang="ts">
import { init_renderer } from "../scripts/renderer.ts";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Hello from main!");

    const canvas = document.getElementById("display") as HTMLCanvasElement;

    let large: string = init_renderer(canvas, "Medieval_Medium_House.litematic")!;

    if (large) {
        canvas.innerText = "TOO LARGE OF A STRUCTURE TO RENDER";
    }
})

</script>

<template>
    <canvas id="display"></canvas>
</template>

