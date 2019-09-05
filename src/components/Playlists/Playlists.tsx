import Swiper from 'swiper';
import React from 'react';
import styled from 'styled-components';

interface Props {
  onChangePlaylist: Function;
  playlists: Array<any>;
}
interface State {
  isPlaying: boolean;
  coverflow: Swiper | null;
}

export default class Playlists extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isPlaying: false,
      coverflow: null,
    };
  }
  componentDidMount() {
    if (document.querySelector('.swiper-slide')) {
      this.setState({
        coverflow: new Swiper('.swiper-container', {
          // init: false,
          effect: 'coverflow',
          grabCursor: true,
          loop: false,
          centeredSlides: true,
          slidesPerView: 'auto',
          coverflowEffect: {
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          },
          speed: 500,
        }),
      });
      if (this.state.coverflow) {
        const activeIndex = this.state.coverflow.activeIndex;
        this.props.onChangePlaylist(activeIndex);
        // this.state.coverflow.on('init', () => {
        //   this.props.onChangePlaylist(activeIndex);
        // });
        this.state.coverflow.on('slideChange', () => {
          this.props.onChangePlaylist(activeIndex);
        });
        // TODO: initを自動にしても大丈夫か
        // this.state.coverflow.init();
      }
    }
  }

  render() {
    return (
      <div className="swiper-container">
        <Playlist className="swiper-wrapper">
          {this.props.playlists.map((item, key) => {
            return (
              <PlaylistItem key={key} className="swiper-slide">
                <img src={item.images[0].url} alt="" />
              </PlaylistItem>
            );
          })}
        </Playlist>
      </div>
    );
  }
}

const Playlist = styled.ul`
  list-style: none;
  padding: 0;
`;
const PlaylistItem = styled.li`
  width: 50%;
  background: transparent;
  img {
    width: 100%;
  }
`;
