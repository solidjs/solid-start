import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { SolidStartLogo } from "./icons/solidstart-logo";
export function DownloadLogosMenu() {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <SolidStartLogo class="drop-shadow-[10px_20px_35px_rgb(125,211,252,0.3)] size-52 md:size-[400px] mx-auto" />
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuSub overlap>
              <ContextMenuSubTrigger>
                Solid<b>Start</b>
              </ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent>
                  <ContextMenuItem>
                    <a href="/start-logo.png" download="solidstart-logo.png">
                      solid-start.png
                    </a>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <a href="/start-logo.svg" download="solidstart-logo.svg">
                      solid-start.svg
                    </a>
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>
          </ContextMenuGroup>

          <ContextMenuGroup>
            <ContextMenuSub overlap>
              <ContextMenuSubTrigger>Solid</ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent>
                  <ContextMenuItem>
                    <a href="/solid-logo.png" download="solid-logo.png">
                      solid-logo.png
                    </a>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <a href="/solid-logo.svg" download="solid-logo.svg">
                      solid-logo.svg
                    </a>
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuItem>
            <a href="/solid-logos.zip" download="solid-logos.zip">
              solid-logos.zip
            </a>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenu>
  );
}
