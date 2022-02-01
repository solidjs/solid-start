import { Component } from "solid-js";
import {Link, Outlet} from "solid-app-router";

const Index: Component = () => {
    return (<div>
      Header from Layout<Outlet />
    </div>);
  };
  
  export default Index;