<template>
  <div class="container">
    <h1 class="text-center">🔥 Kitty Tinder 🔥</h1>

    <router-view/>
  </div>
</template>

<style lang="scss">
    @import url('https://fonts.googleapis.com/css?family=Roboto+Mono&display=swap');

    $enable-rounded: false;

    @import '../node_modules/bootstrap/scss/bootstrap';

    body {
        background: ghostwhite;
        margin: 30px;
    }


    .bg-minty {
        background-color: #C5E3BF;
    }

    .bg-yellowy {
        background-color: #FFF3D8;
    }

    .bg-tomato {
        background-color: #FF6347;
    }
</style>
